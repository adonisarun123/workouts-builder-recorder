import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import OpenAI from "openai";

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
app.use(express.static(__dirname));

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

async function generateSmartSummary(session, profile) {
  if (!openai) {
    return "Solid session logged. Continue progressive overload when readiness is stable and no pain is present.";
  }

  const prompt = `You are a strength coach AI. Give concise session feedback and next-load recommendation.
Profile: ${JSON.stringify(profile)}
Session: ${JSON.stringify(session)}
Return 3 bullet points.`;

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: prompt,
  });

  return response.output_text || "Session logged successfully.";
}

async function updateUserMemoryMarkdown(userId) {
  const profileQuery = `
    SELECT u.id, u.full_name, u.email, u.goal_primary, u.experience_level, p.age, p.equipment, p.days_per_week, p.max_duration, p.injuries
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
  const sessions = (await pool.query(sessionsQuery, [userId])).rows;

  const avgCompletion = sessions.length
    ? (sessions.reduce((a, s) => a + Number(s.completion_percent || 0), 0) / sessions.length).toFixed(1)
    : "0";
  const totalVolume = sessions.reduce((a, s) => a + Number(s.total_volume || 0), 0).toFixed(0);

  const content = `# User Memory: ${profile.full_name}

## Identity
- User ID: ${profile.id}
- Email: ${profile.email}
- Goal: ${profile.goal_primary || "Not set"}
- Experience: ${profile.experience_level || "Not set"}

## Profile Snapshot
- Age: ${profile.age ?? "N/A"}
- Equipment: ${profile.equipment ?? "N/A"}
- Training days/week: ${profile.days_per_week ?? "N/A"}
- Max duration: ${profile.max_duration ?? "N/A"} min
- Injuries / limits: ${profile.injuries ?? "None"}

## Growth Summary
- Sessions tracked: ${sessions.length}
- Average completion: ${avgCompletion}%
- Total volume (tracked window): ${totalVolume}

## Recent Session Log
${sessions
  .map(
    (s, i) => `${i + 1}. ${new Date(s.created_at).toISOString().slice(0, 10)} | completion ${s.completion_percent}% | volume ${Math.round(Number(s.total_volume || 0))} | readiness ${Number(s.readiness_score || 0).toFixed(1)} | pain ${s.pain_flag ? "yes" : "no"}`
  )
  .join("\n")}

## AI Coaching Context
Use this memory as personalization context for future recommendations. Prioritize pain safety, readiness trends, and adherence consistency.
`;

  const filePath = path.join(__dirname, "user_memories", `${userId}.md`);
  await fs.writeFile(filePath, content, "utf8");
}

app.post("/api/auth/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: "Missing required fields" });

  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users(full_name, email, password_hash) VALUES($1,$2,$3) RETURNING id, full_name, email",
      [fullName, email.toLowerCase(), hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
    await updateUserMemoryMarkdown(user.id);
    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: "Registration failed", detail: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT id, email, full_name, password_hash FROM users WHERE email=$1", [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
});

app.post("/api/profile", auth, async (req, res) => {
  const { fullName, goal, experience, age, equipment, daysPerWeek, maxDuration, injuries } = req.body;

  await pool.query("UPDATE users SET full_name=$1, goal_primary=$2, experience_level=$3 WHERE id=$4", [fullName, goal, experience, req.user.id]);
  await pool.query(
    `INSERT INTO user_profiles(user_id, age, equipment, days_per_week, max_duration, injuries)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id) DO UPDATE
     SET age=excluded.age, equipment=excluded.equipment, days_per_week=excluded.days_per_week, max_duration=excluded.max_duration, injuries=excluded.injuries, updated_at=NOW()`,
    [req.user.id, age || null, equipment || null, daysPerWeek || null, maxDuration || null, injuries || null]
  );

  await updateUserMemoryMarkdown(req.user.id);
  res.json({ ok: true });
});

app.post("/api/sessions", auth, async (req, res) => {
  const { readiness, session, exercises } = req.body;

  await pool.query(
    `INSERT INTO readiness_logs(user_id, sleep_hours, energy_score, soreness_score, stress_score, motivation_score, pain_today)
     VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [req.user.id, readiness.sleep, readiness.energy, readiness.soreness, readiness.stress, readiness.motivation, readiness.pain]
  );

  const profileResult = await pool.query("SELECT goal_primary, experience_level FROM users WHERE id=$1", [req.user.id]);
  const smartFeedback = await generateSmartSummary(session, profileResult.rows[0] || {});

  const insertedSession = await pool.query(
    `INSERT INTO workout_sessions(user_id, completion_percent, total_volume, avg_rir_delta, readiness_score, pain_flag, feedback)
     VALUES($1,$2,$3,$4,$5,$6,$7)
     RETURNING id`,
    [req.user.id, session.completion, session.volume, session.rirDeltaAvg, session.readiness, session.painFlag, smartFeedback]
  );

  const sessionId = insertedSession.rows[0].id;

  for (const ex of exercises) {
    await pool.query(
      `INSERT INTO session_exercise_logs(session_id, user_id, exercise_name, planned_sets, planned_reps, planned_weight, planned_rir, actual_reps, actual_weight, actual_rir, completed, notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [sessionId, req.user.id, ex.exercise, ex.plannedSets, ex.plannedReps, ex.plannedWeight, ex.plannedRir, ex.actualReps, ex.actualWeight, ex.actualRir, ex.completed, ex.notes]
    );
  }

  await updateUserMemoryMarkdown(req.user.id);
  res.json({ ok: true, feedback: smartFeedback, sessionId });
});

app.get("/api/sessions", auth, async (req, res) => {
  const rows = await pool.query("SELECT * FROM workout_sessions WHERE user_id=$1 ORDER BY created_at DESC", [req.user.id]);
  res.json(rows.rows);
});

app.listen(port, () => {
  console.log(`Workout app server running on http://localhost:${port}`);
});
