import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import OpenAI from "openai";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: process.env.NEON_DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.static(__dirname));

const SPA_HTML = path.join(__dirname, "index.html");
app.get(["/login", "/profile", "/workout", "/dashboard", "/admin"], (_req, res) => {
  res.sendFile(SPA_HTML);
});

function jwtSecret() {
  return process.env.JWT_SECRET || "dev-secret";
}

function adminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Where the Next.js app lives (OAuth success / error redirects). */
function clientAppUrl() {
  return (process.env.CLIENT_APP_URL || "http://localhost:3001").replace(/\/$/, "");
}

/** Public origin of this API (OAuth redirect_uri must match Google Cloud console). */
function apiPublicBase() {
  return (process.env.API_PUBLIC_URL || process.env.APP_PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, "");
}

let mailTransportCache;
function getMailTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (mailTransportCache !== undefined) return mailTransportCache;
  mailTransportCache = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "1",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return mailTransportCache;
}

async function sendAccountDecisionEmail(to, fullName, decision) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const baseUrl = process.env.APP_PUBLIC_URL || "";
  const transport = getMailTransport();
  if (!transport || !from) {
    console.log(`[email skipped] ${decision} -> ${to}`);
    return { skipped: true };
  }
  const name = fullName || "there";
  const lines =
    decision === "approved"
      ? [
          `Hi ${name},`,
          "",
          "Your WorkoutOS account has been approved.",
          baseUrl ? `You can sign in here: ${baseUrl}` : "You can sign in with the app using your email and password.",
          "",
          "— WorkoutOS",
        ]
      : [
          `Hi ${name},`,
          "",
          "Your WorkoutOS registration was not approved. If you think this is a mistake, reply to whoever invited you or contact support.",
          "",
          "— WorkoutOS",
        ];
  await transport.sendMail({
    from,
    to,
    subject: decision === "approved" ? "Your WorkoutOS account is approved" : "WorkoutOS registration update",
    text: lines.join("\n"),
  });
  return { sent: true };
}

function parseJsonObject(value, fallback = {}) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    return JSON.parse(String(value));
  } catch {
    throw new Error("Invalid JSON object");
  }
}

function parseStringArray(value) {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, jwtSecret());
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function requireApproved(req, res, next) {
  const s = req.user.account_status;
  const role = req.user.role;
  if (role === "admin" && s === "approved") return next();
  if (s === "approved") return next();
  if (s === "pending") return res.status(403).json({ error: "Your account is pending admin approval.", code: "PENDING_APPROVAL" });
  if (s === "rejected") return res.status(403).json({ error: "Your registration was not approved.", code: "REJECTED" });
  return res.status(403).json({ error: "Account not active." });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin" || req.user.account_status !== "approved") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

function roundWeightKg(kg) {
  const n = Number(kg);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n / 2.5) * 2.5;
}

function suggestWeight(exercise, profile, experienceSlug) {
  const bw = Number(profile.weight_kg) || 70;
  const meta = exercise.load_meta || {};
  const exp = experienceSlug || "intermediate";

  if (meta.strategy === "fixed") return Number(meta.kg) || 0;
  if (meta.strategy === "bodyweight_pct") {
    const pct = meta.pct?.[exp] ?? 0.42;
    return roundWeightKg(bw * pct);
  }
  if (meta.strategy === "assisted_bw") {
    const pct = meta.pct?.[exp] ?? 0.2;
    return roundWeightKg(bw * pct);
  }
  if (meta.strategy === "base_kg_scale") {
    const base = Number(meta.baseKg) || 20;
    const scale = meta.scale?.[exp] ?? 1;
    return roundWeightKg(base * scale);
  }
  return roundWeightKg(20);
}

function exerciseFocusScore(ex, focusSlugs) {
  if (!focusSlugs?.length) return 0;
  return ex.muscle_targets.filter((m) => focusSlugs.includes(m)).length;
}

function pickDiverseExercises(scored, targetCount) {
  const picked = [];
  const cover = new Set();
  const pool = [...scored].sort((a, b) => b._focusScore - a._focusScore || a.slug.localeCompare(b.slug));
  for (const ex of pool) {
    if (picked.length >= targetCount) break;
    const novel = ex.muscle_targets.some((m) => !cover.has(m));
    if (novel || picked.length < Math.min(3, targetCount)) {
      picked.push(ex);
      ex.muscle_targets.forEach((m) => cover.add(m));
    }
  }
  for (const ex of pool) {
    if (picked.length >= targetCount) break;
    if (!picked.includes(ex)) picked.push(ex);
  }
  return picked.slice(0, targetCount);
}

function planExerciseCount(goalSlug, durationMin) {
  const d = Number(durationMin) || 60;
  const base = Math.round(d / 14);
  let n = Math.min(8, Math.max(4, base));
  if (goalSlug === "strength_gain") n = Math.min(n + 1, 7);
  if (goalSlug === "fat_loss") n = Math.min(n + 1, 8);
  return n;
}

async function generateSmartSummary(session, profile) {
  if (!openai) {
    return "Session logged. Review completion, RIR vs target, and any pain notes before progressing load.";
  }
  const prompt = `You are a strength coach AI. Give concise session feedback and next-step guidance.
Profile: ${JSON.stringify(profile)}
Session: ${JSON.stringify(session)}
Return 3 short bullet points.`;

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: prompt,
  });
  return response.output_text || "Session logged successfully.";
}

async function updateUserMemoryMarkdown(userId) {
  const profileQuery = `
    SELECT u.id, u.full_name, u.email, u.role, u.account_status,
           p.age, p.height_cm, p.weight_kg, p.sex_slug, p.goal_slug, p.experience_slug,
           p.days_per_week, p.session_duration_min, p.equipment_slugs, p.injuries_limitations,
           p.occupation_activity_slug, p.focus_muscle_slugs, p.sleep_typical_hours, p.training_notes
    FROM users u
    LEFT JOIN user_profiles p ON p.user_id = u.id
    WHERE u.id = $1
  `;
  const sessionsQuery = `
    SELECT created_at, completion_percent, total_volume, avg_rir_delta, readiness_score, pain_flag, feedback
    FROM workout_sessions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const profile = (await pool.query(profileQuery, [userId])).rows[0];
  if (!profile) return;

  const sessions = (await pool.query(sessionsQuery, [userId])).rows;
  const avgCompletion = sessions.length
    ? (sessions.reduce((a, s) => a + Number(s.completion_percent || 0), 0) / sessions.length).toFixed(1)
    : "0";
  const totalVolume = sessions.reduce((a, s) => a + Number(s.total_volume || 0), 0).toFixed(0);

  const content = `# User Memory: ${profile.full_name}

## Identity
- User ID: ${profile.id}
- Email: ${profile.email}
- Role: ${profile.role}
- Account: ${profile.account_status}
- Goal: ${profile.goal_slug || "Not set"}
- Experience: ${profile.experience_slug || "Not set"}

## Profile Snapshot
- Age: ${profile.age ?? "N/A"} | Height (cm): ${profile.height_cm ?? "N/A"} | Weight (kg): ${profile.weight_kg ?? "N/A"}
- Sex: ${profile.sex_slug ?? "N/A"}
- Days/week: ${profile.days_per_week ?? "N/A"} | Session cap (min): ${profile.session_duration_min ?? "N/A"}
- Equipment (slugs): ${JSON.stringify(profile.equipment_slugs || [])}
- Occupation activity: ${profile.occupation_activity_slug ?? "N/A"}
- Focus muscles: ${JSON.stringify(profile.focus_muscle_slugs || [])}
- Typical sleep (h): ${profile.sleep_typical_hours ?? "N/A"}
- Injuries / limits: ${profile.injuries_limitations ?? "None"}
- Meds / notes: ${profile.medications_notes ?? "None"}
- Training notes: ${profile.training_notes ?? "None"}

## Growth Summary
- Sessions tracked: ${sessions.length}
- Average completion: ${avgCompletion}%
- Total volume (tracked window): ${totalVolume}

## Recent Session Log
${sessions
  .map(
    (s, i) =>
      `${i + 1}. ${new Date(s.created_at).toISOString().slice(0, 10)} | completion ${s.completion_percent}% | volume ${Math.round(Number(s.total_volume || 0))} | readiness ${Number(s.readiness_score || 0).toFixed(1)} | pain ${s.pain_flag ? "yes" : "no"}`
  )
  .join("\n")}

## Coaching context
Prioritize safety (pain, readiness), adherence, and progressive overload aligned to stated goal and equipment.
`;

  const filePath = path.join(__dirname, "user_memories", `${userId}.md`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function mapCatalog(rows) {
  const by = {};
  for (const r of rows) {
    if (!by[r.category]) by[r.category] = [];
    by[r.category].push({
      slug: r.slug,
      label: r.label,
      sortOrder: r.sort_order,
      meta: r.meta || {},
    });
  }
  for (const k of Object.keys(by)) {
    by[k].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  }
  return by;
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: true });
  } catch (e) {
    res.status(503).json({ ok: false, database: false, error: "Database unreachable", detail: e.message });
  }
});

app.get("/api/catalog", async (_req, res) => {
  try {
    const opts = (
      await pool.query(
        `SELECT category, slug, label, sort_order, meta FROM reference_options WHERE active = true ORDER BY category, sort_order`
      )
    ).rows;
    const ex = (
      await pool.query(
        `SELECT id, slug, name, muscle_targets, required_equipment_slugs, goal_slugs,
                min_experience_sort, max_experience_sort, sets_default, reps_scheme, rir_default, rest_seconds, load_meta
         FROM exercises WHERE active = true ORDER BY name`
      )
    ).rows;
    res.json({ optionsByCategory: mapCatalog(opts), exercises: ex });
  } catch (e) {
    res.status(500).json({ error: "Failed to load catalog", detail: e.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: "Missing required fields" });

  const normalized = email.trim().toLowerCase();
  const admins = adminEmailSet();
  const bootstrapAdmin = admins.has(normalized);
  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users(full_name, email, password_hash, role, account_status, approved_at, approved_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, full_name, email, role, account_status`,
      [
        fullName.trim(),
        normalized,
        hash,
        bootstrapAdmin ? "admin" : "user",
        bootstrapAdmin ? "approved" : "pending",
        bootstrapAdmin ? new Date() : null,
        null,
      ]
    );
    const user = result.rows[0];
    await pool.query(`INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [user.id]);

    if (bootstrapAdmin) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, account_status: user.account_status },
        jwtSecret(),
        { expiresIn: "7d" }
      );
      return res.json({
        token,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, account_status: user.account_status },
        pendingApproval: false,
      });
    }

    res.json({
      pendingApproval: true,
      message: "Registration received. An administrator must approve your account before you can sign in.",
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "This email is already registered",
        detail: "Try signing in with that email, or use a different address.",
      });
    }
    const dbDown = ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT"].includes(error.code) || /connection|connect|neon|timeout/i.test(String(error.message));
    const status = dbDown ? 503 : 400;
    const errMsg = dbDown ? "Cannot reach the database" : "Registration failed";
    res.status(status).json({ error: errMsg, detail: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalized = (email || "").trim().toLowerCase();
    const result = await pool.query(
      `SELECT id, email, full_name, password_hash, role, account_status FROM users WHERE email=$1`,
      [normalized]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (user.account_status === "pending") {
      return res.status(403).json({ error: "Your account is pending admin approval.", code: "PENDING_APPROVAL" });
    }
    if (user.account_status === "rejected") {
      return res.status(403).json({ error: "Your registration was not approved.", code: "REJECTED" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, account_status: user.account_status },
      jwtSecret(),
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        account_status: user.account_status,
      },
    });
  } catch (e) {
    res.status(503).json({ error: "Server unavailable", detail: e.message });
  }
});

app.get("/api/auth/google/start", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const msg = encodeURIComponent(
      "Google sign-in is not configured on the API. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or create an account with email."
    );
    return res.redirect(`${clientAppUrl()}/login?error=${msg}`);
  }
  try {
    const state = jwt.sign({ purpose: "google_oauth", n: crypto.randomBytes(8).toString("hex") }, jwtSecret(), {
      expiresIn: "10m",
    });
    const redirectUri = `${apiPublicBase()}/api/auth/google/callback`;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    res.redirect(url.toString());
  } catch (e) {
    res.redirect(`${clientAppUrl()}/login?error=${encodeURIComponent(e.message || "oauth_start_failed")}`);
  }
});

app.get("/api/auth/google/callback", async (req, res) => {
  const fail = (msg) => res.redirect(`${clientAppUrl()}/login?error=${encodeURIComponent(msg)}`);
  const { code, state, error: oauthError } = req.query;

  if (oauthError) return fail(String(oauthError));
  if (!code || !state) return fail("Missing OAuth response from Google.");

  try {
    jwt.verify(String(state), jwtSecret());
  } catch {
    return fail("Invalid or expired sign-in attempt. Please try again.");
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return fail("Google OAuth is not configured.");
  }

  const redirectUri = `${apiPublicBase()}/api/auth/google/callback`;

  let tokenJson;
  try {
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokenJson = await tr.json();
    if (!tr.ok) {
      console.error("[google oauth token]", tokenJson);
      return fail(tokenJson.error_description || tokenJson.error || "Could not complete Google sign-in.");
    }
  } catch (e) {
    console.error("[google oauth token]", e);
    return fail("Could not reach Google. Try again later.");
  }

  const accessToken = tokenJson.access_token;
  let profile;
  try {
    const ur = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    profile = await ur.json();
    if (!ur.ok || !profile.email) {
      return fail("Could not read your Google account email.");
    }
  } catch (e) {
    console.error("[google userinfo]", e);
    return fail("Could not read Google profile.");
  }

  const email = String(profile.email).trim().toLowerCase();
  const fullName = String(profile.name || profile.email || "User").trim();
  const admins = adminEmailSet();
  const bootstrapAdmin = admins.has(email);

  try {
    const existing = await pool.query(
      `SELECT id, email, full_name, role, account_status FROM users WHERE email=$1`,
      [email]
    );
    let user = existing.rows[0];

    if (!user) {
      const randomPass = await bcrypt.hash(crypto.randomUUID(), 10);
      const role = bootstrapAdmin ? "admin" : "user";
      const status = bootstrapAdmin ? "approved" : "pending";
      const ins = await pool.query(
        `INSERT INTO users(full_name, email, password_hash, role, account_status, approved_at, approved_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, full_name, email, role, account_status`,
        [fullName, email, randomPass, role, status, bootstrapAdmin ? new Date() : null, null]
      );
      user = ins.rows[0];
      await pool.query(`INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [user.id]);
    }

    if (user.account_status === "pending") {
      return res.redirect(
        `${clientAppUrl()}/login?notice=${encodeURIComponent(
          "Your account is pending admin approval before you can sign in."
        )}`
      );
    }
    if (user.account_status === "rejected") {
      return fail("Your registration was not approved.");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, account_status: user.account_status },
      jwtSecret(),
      { expiresIn: "7d" }
    );
    res.redirect(`${clientAppUrl()}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (e) {
    console.error("[google oauth user]", e);
    return fail("Could not create or load your account.");
  }
});

app.get("/api/me", auth, async (req, res) => {
  try {
    const u = (
      await pool.query(`SELECT id, email, full_name, role, account_status, created_at FROM users WHERE id=$1`, [req.user.id])
    ).rows[0];
    const p = (await pool.query(`SELECT * FROM user_profiles WHERE user_id=$1`, [req.user.id])).rows[0];
    res.json({ user: u, profile: p || {} });
  } catch (e) {
    res.status(500).json({ error: "Failed to load profile", detail: e.message });
  }
});

app.post("/api/profile", auth, requireApproved, async (req, res) => {
  const b = req.body || {};
  const equipmentSlugs = Array.isArray(b.equipmentSlugs) ? b.equipmentSlugs : [];
  const focusMuscleSlugs = Array.isArray(b.focusMuscleSlugs) ? b.focusMuscleSlugs : [];

  await pool.query(`UPDATE users SET full_name=$1 WHERE id=$2`, [String(b.fullName || "").trim() || req.user.email, req.user.id]);

  await pool.query(
    `INSERT INTO user_profiles(
       user_id, age, height_cm, weight_kg, sex_slug, goal_slug, experience_slug,
       days_per_week, session_duration_min, equipment_slugs, injuries_limitations,
       medications_notes, occupation_activity_slug, focus_muscle_slugs, sleep_typical_hours,
       training_notes, profile_completed, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14::jsonb,$15,$16,$17,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       age=excluded.age,
       height_cm=excluded.height_cm,
       weight_kg=excluded.weight_kg,
       sex_slug=excluded.sex_slug,
       goal_slug=excluded.goal_slug,
       experience_slug=excluded.experience_slug,
       days_per_week=excluded.days_per_week,
       session_duration_min=excluded.session_duration_min,
       equipment_slugs=excluded.equipment_slugs,
       injuries_limitations=excluded.injuries_limitations,
       medications_notes=excluded.medications_notes,
       occupation_activity_slug=excluded.occupation_activity_slug,
       focus_muscle_slugs=excluded.focus_muscle_slugs,
       sleep_typical_hours=excluded.sleep_typical_hours,
       training_notes=excluded.training_notes,
       profile_completed=excluded.profile_completed,
       updated_at=NOW()`,
    [
      req.user.id,
      b.age != null && b.age !== "" ? Number(b.age) : null,
      b.heightCm != null && b.heightCm !== "" ? Number(b.heightCm) : null,
      b.weightKg != null && b.weightKg !== "" ? Number(b.weightKg) : null,
      b.sexSlug || null,
      b.goalSlug || null,
      b.experienceSlug || null,
      b.daysPerWeek != null && b.daysPerWeek !== "" ? Number(b.daysPerWeek) : null,
      b.sessionDurationMin != null && b.sessionDurationMin !== "" ? Number(b.sessionDurationMin) : null,
      JSON.stringify(equipmentSlugs),
      b.injuriesLimitations != null ? String(b.injuriesLimitations) : null,
      b.medicationsNotes != null ? String(b.medicationsNotes) : null,
      b.occupationActivitySlug || null,
      JSON.stringify(focusMuscleSlugs),
      b.sleepTypicalHours != null && b.sleepTypicalHours !== "" ? Number(b.sleepTypicalHours) : null,
      b.trainingNotes != null ? String(b.trainingNotes) : null,
      Boolean(b.profileCompleted),
    ]
  );

  await updateUserMemoryMarkdown(req.user.id);
  res.json({ ok: true });
});

app.post("/api/plans/generate", auth, requireApproved, async (req, res) => {
  try {
    const profileRow = (
      await pool.query(
        `SELECT p.*, u.full_name FROM user_profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id=$1`,
        [req.user.id]
      )
    ).rows[0];

    if (!profileRow?.goal_slug || !profileRow?.experience_slug) {
      return res.status(400).json({ error: "Set goal and experience in your profile first." });
    }
    let equipment = profileRow.equipment_slugs;
    if (equipment == null) equipment = [];
    else if (typeof equipment === "string") {
      try {
        equipment = JSON.parse(equipment || "[]");
      } catch {
        equipment = [];
      }
    }
    else if (!Array.isArray(equipment)) equipment = [];
    if (!equipment.length) {
      return res.status(400).json({ error: "Select at least one equipment option in your profile." });
    }

    const expRow = (
      await pool.query(`SELECT sort_order, meta FROM reference_options WHERE category='experience' AND slug=$1`, [
        profileRow.experience_slug,
      ])
    ).rows[0];
    const expSort = expRow ? Number(expRow.sort_order) : 1;
    const volumeScale = expRow?.meta?.volumeScale != null ? Number(expRow.meta.volumeScale) : 1;

    let focus = profileRow.focus_muscle_slugs;
    if (focus == null) focus = [];
    else if (typeof focus === "string") {
      try {
        focus = JSON.parse(focus || "[]");
      } catch {
        focus = [];
      }
    }
    else if (!Array.isArray(focus)) focus = [];

    const all = (
      await pool.query(
        `SELECT * FROM exercises WHERE active = true AND $1 = ANY(goal_slugs) AND min_experience_sort <= $2 AND max_experience_sort >= $2`,
        [profileRow.goal_slug, expSort]
      )
    ).rows;

    const filtered = all.filter((ex) => ex.required_equipment_slugs.every((reqEq) => equipment.includes(reqEq)));

    if (!filtered.length) {
      return res.status(400).json({
        error: "No exercises match your goal, experience, and equipment. Add equipment or adjust goal in your profile.",
      });
    }

    const targetCount = planExerciseCount(profileRow.goal_slug, profileRow.session_duration_min);
    const scored = filtered.map((ex) => ({ ...ex, _focusScore: exerciseFocusScore(ex, focus) }));
    const picked = pickDiverseExercises(scored, targetCount);

    const plan = picked.map((ex) => {
      const sets = Math.max(2, Math.round(Number(ex.sets_default) * volumeScale));
      const weight = suggestWeight(ex, profileRow, profileRow.experience_slug);
      return {
        exerciseId: ex.id,
        slug: ex.slug,
        exercise: ex.name,
        sets,
        reps: ex.reps_scheme,
        weight,
        rir: ex.rir_default,
        rest: ex.rest_seconds,
      };
    });

    res.json({ plan, meta: { targetCount, experienceSort: expSort } });
  } catch (e) {
    res.status(500).json({ error: "Plan generation failed", detail: e.message });
  }
});

app.get("/api/admin/pending-users", auth, requireAdmin, async (_req, res) => {
  const rows = await pool.query(
    `SELECT id, email, full_name, account_status, created_at FROM users WHERE account_status='pending' ORDER BY created_at ASC`
  );
  res.json(rows.rows);
});

app.post("/api/admin/users/:id/approve", auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const prev = await pool.query(`SELECT email, full_name FROM users WHERE id=$1`, [id]);
  const target = prev.rows[0];
  const result = await pool.query(
    `UPDATE users SET account_status='approved', approved_at=NOW(), approved_by=$1 WHERE id=$2 AND account_status='pending' RETURNING id`,
    [req.user.id, id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Pending user not found" });
  if (target?.email) {
    try {
      await sendAccountDecisionEmail(target.email, target.full_name, "approved");
    } catch (e) {
      console.error("approve email failed:", e.message);
    }
  }
  res.json({ ok: true });
});

app.post("/api/admin/users/:id/reject", auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const prev = await pool.query(`SELECT email, full_name FROM users WHERE id=$1`, [id]);
  const target = prev.rows[0];
  const result = await pool.query(
    `UPDATE users SET account_status='rejected', approved_at=NOW(), approved_by=$1 WHERE id=$2 AND account_status='pending' RETURNING id`,
    [req.user.id, id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Pending user not found" });
  if (target?.email) {
    try {
      await sendAccountDecisionEmail(target.email, target.full_name, "rejected");
    } catch (e) {
      console.error("reject email failed:", e.message);
    }
  }
  res.json({ ok: true });
});

app.get("/api/admin/reference-options", auth, requireAdmin, async (req, res) => {
  try {
    const onlyActive = req.query.active === "true";
    const q = onlyActive
      ? `SELECT id, category, slug, label, sort_order, meta, active, created_at FROM reference_options WHERE active = true ORDER BY category, sort_order`
      : `SELECT id, category, slug, label, sort_order, meta, active, created_at FROM reference_options ORDER BY category, sort_order`;
    const rows = await pool.query(q);
    res.json(rows.rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to list reference options", detail: e.message });
  }
});

app.post("/api/admin/reference-options", auth, requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const category = String(b.category || "").trim();
    const slug = String(b.slug || "").trim();
    const label = String(b.label || "").trim();
    if (!category || !slug || !label) return res.status(400).json({ error: "category, slug, and label are required" });
    const sortOrder = b.sortOrder != null ? Number(b.sortOrder) : 0;
    const meta = parseJsonObject(b.meta, {});
    const active = b.active !== false;
    const row = await pool.query(
      `INSERT INTO reference_options (category, slug, label, sort_order, meta, active)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)
       RETURNING id, category, slug, label, sort_order, meta, active, created_at`,
      [category, slug.toLowerCase().replace(/\s+/g, "_"), label, sortOrder, JSON.stringify(meta), active]
    );
    res.json(row.rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Duplicate category/slug" });
    res.status(400).json({ error: "Create failed", detail: e.message });
  }
});

app.put("/api/admin/reference-options/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body || {};
    const category = String(b.category || "").trim();
    const slug = String(b.slug || "").trim();
    const label = String(b.label || "").trim();
    if (!category || !slug || !label) return res.status(400).json({ error: "category, slug, and label are required" });
    const sortOrder = b.sortOrder != null ? Number(b.sortOrder) : 0;
    const meta = parseJsonObject(b.meta, {});
    const active = Boolean(b.active);
    const row = await pool.query(
      `UPDATE reference_options SET category=$1, slug=$2, label=$3, sort_order=$4, meta=$5::jsonb, active=$6 WHERE id=$7
       RETURNING id, category, slug, label, sort_order, meta, active, created_at`,
      [category, slug.toLowerCase().replace(/\s+/g, "_"), label, sortOrder, JSON.stringify(meta), active, id]
    );
    if (row.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(row.rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Duplicate category/slug" });
    res.status(400).json({ error: "Update failed", detail: e.message });
  }
});

app.delete("/api/admin/reference-options/:id", auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const row = await pool.query(`UPDATE reference_options SET active = false WHERE id = $1 RETURNING id`, [id]);
  if (row.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.get("/api/admin/exercises", auth, requireAdmin, async (req, res) => {
  try {
    const onlyActive = req.query.active === "true";
    const q = onlyActive
      ? `SELECT * FROM exercises WHERE active = true ORDER BY name`
      : `SELECT * FROM exercises ORDER BY name`;
    const rows = await pool.query(q);
    res.json(rows.rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to list exercises", detail: e.message });
  }
});

app.post("/api/admin/exercises", auth, requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const slug = String(b.slug || "").trim().toLowerCase().replace(/\s+/g, "_");
    const name = String(b.name || "").trim();
    if (!slug || !name) return res.status(400).json({ error: "slug and name are required" });
    const muscle_targets = parseStringArray(b.muscleTargets ?? b.muscle_targets);
    const required_equipment_slugs = parseStringArray(b.requiredEquipmentSlugs ?? b.required_equipment_slugs);
    const goal_slugs = parseStringArray(b.goalSlugs ?? b.goal_slugs);
    const load_meta = parseJsonObject(b.loadMeta ?? b.load_meta, {});
    const row = await pool.query(
      `INSERT INTO exercises (
         slug, name, muscle_targets, required_equipment_slugs, goal_slugs,
         min_experience_sort, max_experience_sort, sets_default, reps_scheme, rir_default, rest_seconds, load_meta, active
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)
       RETURNING *`,
      [
        slug,
        name,
        muscle_targets,
        required_equipment_slugs,
        goal_slugs,
        b.minExperienceSort != null ? Number(b.minExperienceSort) : 0,
        b.maxExperienceSort != null ? Number(b.maxExperienceSort) : 2,
        b.setsDefault != null ? Number(b.setsDefault) : 3,
        String(b.repsScheme || b.reps_scheme || "8–12"),
        b.rirDefault != null ? Number(b.rirDefault) : 2,
        b.restSeconds != null ? Number(b.restSeconds) : 90,
        JSON.stringify(load_meta),
        b.active !== false,
      ]
    );
    res.json(row.rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Duplicate exercise slug" });
    res.status(400).json({ error: "Create failed", detail: e.message });
  }
});

app.put("/api/admin/exercises/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body || {};
    const slug = String(b.slug || "").trim().toLowerCase().replace(/\s+/g, "_");
    const name = String(b.name || "").trim();
    if (!slug || !name) return res.status(400).json({ error: "slug and name are required" });
    const muscle_targets = parseStringArray(b.muscleTargets ?? b.muscle_targets);
    const required_equipment_slugs = parseStringArray(b.requiredEquipmentSlugs ?? b.required_equipment_slugs);
    const goal_slugs = parseStringArray(b.goalSlugs ?? b.goal_slugs);
    const load_meta = parseJsonObject(b.loadMeta ?? b.load_meta, {});
    const row = await pool.query(
      `UPDATE exercises SET
         slug=$1, name=$2, muscle_targets=$3, required_equipment_slugs=$4, goal_slugs=$5,
         min_experience_sort=$6, max_experience_sort=$7, sets_default=$8, reps_scheme=$9, rir_default=$10, rest_seconds=$11, load_meta=$12::jsonb, active=$13
       WHERE id=$14 RETURNING *`,
      [
        slug,
        name,
        muscle_targets,
        required_equipment_slugs,
        goal_slugs,
        b.minExperienceSort != null ? Number(b.minExperienceSort) : 0,
        b.maxExperienceSort != null ? Number(b.maxExperienceSort) : 2,
        b.setsDefault != null ? Number(b.setsDefault) : 3,
        String(b.repsScheme || b.reps_scheme || "8–12"),
        b.rirDefault != null ? Number(b.rirDefault) : 2,
        b.restSeconds != null ? Number(b.restSeconds) : 90,
        JSON.stringify(load_meta),
        b.active !== false,
        id,
      ]
    );
    if (row.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(row.rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Duplicate exercise slug" });
    res.status(400).json({ error: "Update failed", detail: e.message });
  }
});

app.delete("/api/admin/exercises/:id", auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const row = await pool.query(`UPDATE exercises SET active = false WHERE id = $1 RETURNING id`, [id]);
  if (row.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.post("/api/sessions", auth, requireApproved, async (req, res) => {
  const { readiness, session, exercises, planSnapshot } = req.body;

  await pool.query(
    `INSERT INTO readiness_logs(user_id, sleep_hours, energy_score, soreness_score, stress_score, motivation_score, pain_today)
     VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [req.user.id, readiness.sleep, readiness.energy, readiness.soreness, readiness.stress, readiness.motivation, readiness.pain]
  );

  const profileResult = await pool.query(
    `SELECT u.full_name, p.goal_slug, p.experience_slug, p.weight_kg, p.injuries_limitations FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.id=$1`,
    [req.user.id]
  );
  const smartFeedback = await generateSmartSummary(session, profileResult.rows[0] || {});

  const insertedSession = await pool.query(
    `INSERT INTO workout_sessions(user_id, completion_percent, total_volume, avg_rir_delta, readiness_score, pain_flag, feedback, plan_snapshot)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
     RETURNING id`,
    [
      req.user.id,
      session.completion,
      session.volume,
      session.rirDeltaAvg,
      session.readiness,
      session.painFlag,
      smartFeedback,
      planSnapshot != null ? JSON.stringify(planSnapshot) : null,
    ]
  );

  const sessionId = insertedSession.rows[0].id;

  for (const ex of exercises) {
    await pool.query(
      `INSERT INTO session_exercise_logs(
         session_id, user_id, exercise_id, exercise_slug, exercise_name,
         planned_sets, planned_reps, planned_weight, planned_rir,
         actual_reps, actual_weight, actual_rir, completed, notes
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        sessionId,
        req.user.id,
        ex.exerciseId || null,
        ex.exerciseSlug || null,
        ex.exercise,
        ex.plannedSets,
        ex.plannedReps,
        ex.plannedWeight,
        ex.plannedRir,
        ex.actualReps,
        ex.actualWeight,
        ex.actualRir,
        ex.completed,
        ex.notes,
      ]
    );
  }

  await updateUserMemoryMarkdown(req.user.id);
  res.json({ ok: true, feedback: smartFeedback, sessionId });
});

app.get("/api/sessions", auth, requireApproved, async (req, res) => {
  const rows = await pool.query(`SELECT * FROM workout_sessions WHERE user_id=$1 ORDER BY created_at DESC`, [req.user.id]);
  res.json(rows.rows);
});

app.listen(port, () => {
  console.log(`Workout app server running on http://localhost:${port}`);
});
