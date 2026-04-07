const plan = [];
const sessions = [];
let catalog = null;
let authToken = localStorage.getItem("token") || "";
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem("user") || "null");
} catch {
  currentUser = null;
}

const API_BASE_STORAGE_KEY = "workoutos_api_base";

function applySavedApiBaseFromStorage() {
  try {
    const explicit = window.WORKOUTOS_API_BASE && String(window.WORKOUTOS_API_BASE).trim();
    if (explicit) return;
    const saved = localStorage.getItem(API_BASE_STORAGE_KEY);
    if (saved && String(saved).trim()) {
      window.WORKOUTOS_API_BASE = String(saved).trim().replace(/\/$/, "");
    }
  } catch (_) {
    /* ignore */
  }
}
applySavedApiBaseFromStorage();

const els = {
  authState: document.getElementById("authState"),
  registerNotice: document.getElementById("registerNotice"),
  adminPanel: document.getElementById("adminPanel"),
  adminTable: document.querySelector("#adminTable tbody"),
  appPanel: document.getElementById("appPanel"),
  workPanel: document.getElementById("workPanel"),
  planSection: document.getElementById("planSection"),
  logSection: document.getElementById("logSection"),
  feedbackSection: document.getElementById("feedbackSection"),
  dashboardSection: document.getElementById("dashboardSection"),
  planMeta: document.getElementById("planMeta"),
  adminCatalogPanel: document.getElementById("adminCatalogPanel"),
};

const authFeedbackClass = {
  error: "auth-feedback is-error",
  success: "auth-feedback is-success",
  info: "auth-feedback is-info",
  muted: "auth-feedback is-muted",
};

function setAuthState(message, kind = "info") {
  els.authState.textContent = message;
  els.authState.className = authFeedbackClass[kind] || authFeedbackClass.info;
}

function showEl(el, on) {
  el.classList.toggle("hidden", !on);
}

const STATIC_ONLY_HOST_HINT =
  "Static hosting has no /api routes. Deploy server.js (Render, Railway, Fly, etc.) and paste that URL under “Backend server URL” below, then click Save & connect. Or run npm run dev and open http://localhost:3000. You can also set window.WORKOUTOS_API_BASE in index.html before app.js loads.";

function apiUrl(path) {
  const base =
    typeof window !== "undefined" && window.WORKOUTOS_API_BASE != null
      ? String(window.WORKOUTOS_API_BASE).trim().replace(/\/$/, "")
      : "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function looksLikeStaticHost404Page(text) {
  const s = String(text || "");
  if (/:root\s*\{/.test(s)) return true;
  if (/<!DOCTYPE\s+html/i.test(s) && /Page not found|404/i.test(s)) return true;
  return false;
}

function stripHtmlPreview(raw, max = 240) {
  if (!raw) return "";
  const t = String(raw).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
  const out = t.replace(/\s+/g, " ").trim().slice(0, max);
  if (/^:root|var\(--|colorRgbFacets/i.test(out)) return "";
  return out;
}

function messageFromPayload(data, status) {
  const parts = [data.error, data.detail].map((p) => (p == null ? "" : String(p).trim())).filter(Boolean);
  if (parts.length) return parts.length === 1 ? parts[0] : `${parts[0]}. ${parts[1]}`;
  return `Something went wrong (${status})`;
}

function errorPayloadFromText(response, text) {
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (response.status === 404 && looksLikeStaticHost404Page(text)) {
        data = {
          error: "No WorkoutOS API at this URL",
          detail: STATIC_ONLY_HOST_HINT,
        };
      } else {
        const preview = stripHtmlPreview(text);
        data = {
          error: `Server error (${response.status})`,
          detail: preview || undefined,
        };
        if (!preview && response.status === 404) {
          data.detail =
            "Nothing handled /api/… on this host. Use the Node server URL or set window.WORKOUTOS_API_BASE to your API.";
        }
      }
    }
  }
  if (!data.error && !data.detail) {
    if (response.status === 404) {
      data = {
        error: "API not found on this address",
        detail:
          "Open the app from the same host as server.js (e.g. http://localhost:3000), or configure WORKOUTOS_API_BASE if the API is elsewhere.",
      };
    } else {
      data = { error: `Request failed (${response.status} ${response.statusText || ""})`.trim(), detail: "" };
    }
  }
  return data;
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), options);
  } catch (e) {
    const isNetwork =
      e.name === "TypeError" ||
      /failed to fetch|networkerror|load failed|network request failed/i.test(String(e.message));
    const msg = isNetwork
      ? `Cannot reach the API at ${apiUrl("/api/health")}. Start the Node server (npm run dev), fix the URL, or set window.WORKOUTOS_API_BASE if the UI is on another domain.`
      : e.message || "Network error";
    const err = new Error(msg);
    err.network = isNetwork;
    throw err;
  }

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new Error("The server returned invalid data. Check that you are using the correct app URL.");
      }
      data = errorPayloadFromText(response, text);
    }
  } else if (!response.ok) {
    data = errorPayloadFromText(response, "");
  }

  if (!response.ok) {
    const err = new Error(messageFromPayload(data, response.status));
    err.code = data.code;
    err.status = response.status;
    err.detail = data.detail;
    throw err;
  }

  return data;
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` };
}

function readinessPayload() {
  return {
    sleep: Number(document.getElementById("sleep").value || 0),
    energy: Number(document.getElementById("energy").value || 0),
    soreness: Number(document.getElementById("soreness").value || 0),
    stress: Number(document.getElementById("stress").value || 0),
    motivation: Number(document.getElementById("motivation").value || 0),
    pain: document.getElementById("pain").value === "true",
  };
}

function readinessScore(r) {
  return Math.max(
    0,
    Math.min(
      10,
      (r.sleep / 8) * 2 +
        r.energy * 0.25 +
        r.motivation * 0.2 +
        (11 - r.soreness) * 0.18 +
        (11 - r.stress) * 0.17 +
        (r.pain ? -2 : 0)
    )
  );
}

function fillSelect(selectEl, items, placeholder) {
  selectEl.innerHTML = "";
  if (placeholder) {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = placeholder;
    selectEl.appendChild(o);
  }
  for (const it of items || []) {
    const o = document.createElement("option");
    o.value = it.slug;
    o.textContent = it.label;
    selectEl.appendChild(o);
  }
}

function renderEquipmentAndFocus() {
  const by = catalog?.optionsByCategory || {};
  const equip = by.equipment || [];
  const presets = by.equipment_preset || [];
  const muscles = by.muscle_group || [];

  const presetRow = document.getElementById("equipmentPresetRow");
  presetRow.innerHTML = "";
  presets.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = p.label;
    b.addEventListener("click", () => applyEquipmentPreset(p.meta?.equipment_slugs || []));
    presetRow.appendChild(b);
  });

  const eqHost = document.getElementById("equipmentChecks");
  eqHost.innerHTML = "";
  equip.forEach((item) => {
    const label = document.createElement("label");
    label.className = "check-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.slug = item.slug;
    label.appendChild(input);
    label.appendChild(document.createTextNode(` ${item.label}`));
    eqHost.appendChild(label);
  });

  const focusHost = document.getElementById("focusChecks");
  focusHost.innerHTML = "";
  muscles.forEach((item) => {
    const label = document.createElement("label");
    label.className = "check-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.slug = item.slug;
    label.appendChild(input);
    label.appendChild(document.createTextNode(` ${item.label}`));
    focusHost.appendChild(label);
  });
}

function applyEquipmentPreset(slugs) {
  document.querySelectorAll("#equipmentChecks input[type=checkbox]").forEach((cb) => {
    cb.checked = slugs.includes(cb.dataset.slug);
  });
}

function getCheckedSlugs(containerSelector) {
  return Array.from(document.querySelectorAll(`${containerSelector} input[type=checkbox]:checked`)).map((cb) => cb.dataset.slug);
}

function setCheckedSlugs(containerSelector, slugs) {
  const set = new Set(slugs || []);
  document.querySelectorAll(`${containerSelector} input[type=checkbox]`).forEach((cb) => {
    cb.checked = set.has(cb.dataset.slug);
  });
}

function syncApiBaseUrlField() {
  const el = document.getElementById("apiBaseUrl");
  if (!el) return;
  const b = window.WORKOUTOS_API_BASE && String(window.WORKOUTOS_API_BASE).trim() ? window.WORKOUTOS_API_BASE : "";
  el.value = b;
}

async function loadCatalog() {
  catalog = await api("/api/catalog");
  const by = catalog.optionsByCategory || {};
  fillSelect(document.getElementById("goalSlug"), by.goal, "Select goal");
  fillSelect(document.getElementById("experienceSlug"), by.experience, "Select experience");
  fillSelect(document.getElementById("sexSlug"), by.sex, "Prefer not to say");
  fillSelect(document.getElementById("occupationActivitySlug"), by.occupation_activity, "Select activity level");
  renderEquipmentAndFocus();
  setAuthState(authToken ? "Checking session…" : "Not signed in.", "muted");
}

async function bootstrapAfterCatalogLoaded() {
  setDefaultReadinessInputs();
  if (authToken) {
    await refreshMe();
    await refreshSessions();
  } else {
    setAuthState("Not signed in.", "muted");
  }
}

function openApiBasePanel() {
  const p = document.getElementById("apiBasePanel");
  if (p) p.open = true;
  syncApiBaseUrlField();
}

async function saveApiBaseFromForm() {
  let raw = document.getElementById("apiBaseUrl")?.value?.trim() || "";
  raw = raw.replace(/\/$/, "");
  if (!raw) {
    try {
      localStorage.removeItem(API_BASE_STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
    window.WORKOUTOS_API_BASE = "";
  } else {
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
    try {
      new URL(raw);
    } catch {
      setAuthState("Enter a valid URL, e.g. https://your-app.onrender.com (no path, no trailing slash).", "error");
      return;
    }
    try {
      localStorage.setItem(API_BASE_STORAGE_KEY, raw);
    } catch (_) {
      /* ignore */
    }
    window.WORKOUTOS_API_BASE = raw;
  }
  setAuthState("Connecting to API…", "muted");
  try {
    await loadCatalog();
    await bootstrapAfterCatalogLoaded();
  } catch (e) {
    const extra =
      /No WorkoutOS API|WORKOUTOS_API_BASE|static hosting/i.test(e.message)
        ? ""
        : " Confirm the server is running and the database is set up (NEON_DATABASE_URL, migrate, seed).";
    setAuthState(`${e.message}${extra}`, "error");
    openApiBasePanel();
  }
}

async function clearApiBaseAndRetry() {
  try {
    localStorage.removeItem(API_BASE_STORAGE_KEY);
  } catch (_) {
    /* ignore */
  }
  window.WORKOUTOS_API_BASE = "";
  syncApiBaseUrlField();
  setAuthState("Retrying without a saved API URL…", "muted");
  try {
    await loadCatalog();
    await bootstrapAfterCatalogLoaded();
  } catch (e) {
    setAuthState(`Could not load catalog: ${e.message}`, "error");
    openApiBasePanel();
  }
}

function applyProfileToForm(profile) {
  if (!profile) return;
  document.getElementById("fullName").value = profile.full_name_hint || "";
  document.getElementById("age").value = profile.age ?? "";
  document.getElementById("heightCm").value = profile.height_cm ?? "";
  document.getElementById("weightKg").value = profile.weight_kg ?? "";
  document.getElementById("goalSlug").value = profile.goal_slug || "";
  document.getElementById("experienceSlug").value = profile.experience_slug || "";
  document.getElementById("sexSlug").value = profile.sex_slug || "";
  document.getElementById("daysPerWeek").value = profile.days_per_week ?? "";
  document.getElementById("sessionDurationMin").value = profile.session_duration_min ?? "";
  document.getElementById("occupationActivitySlug").value = profile.occupation_activity_slug || "";
  document.getElementById("sleepTypicalHours").value = profile.sleep_typical_hours ?? "";
  document.getElementById("injuriesLimitations").value = profile.injuries_limitations || "";
  document.getElementById("medicationsNotes").value = profile.medications_notes || "";
  document.getElementById("trainingNotes").value = profile.training_notes || "";
  document.getElementById("profileCompleted").checked = Boolean(profile.profile_completed);

  let equip = profile.equipment_slugs;
  if (typeof equip === "string") {
    try {
      equip = JSON.parse(equip || "[]");
    } catch {
      equip = [];
    }
  }
  setCheckedSlugs("#equipmentChecks", Array.isArray(equip) ? equip : []);

  let focus = profile.focus_muscle_slugs;
  if (typeof focus === "string") {
    try {
      focus = JSON.parse(focus || "[]");
    } catch {
      focus = [];
    }
  }
  setCheckedSlugs("#focusChecks", Array.isArray(focus) ? focus : []);
}

async function refreshMe() {
  if (!authToken) {
    showEl(els.appPanel, false);
    showEl(els.workPanel, false);
    showEl(els.planSection, false);
    showEl(els.logSection, false);
    showEl(els.feedbackSection, false);
    showEl(els.dashboardSection, false);
    showEl(els.adminPanel, false);
    showEl(els.adminCatalogPanel, false);
    setAuthState("Not signed in.", "muted");
    return;
  }
  try {
    const data = await api("/api/me", { headers: authHeaders() });
    currentUser = data.user;
    localStorage.setItem("user", JSON.stringify(currentUser));
    document.getElementById("fullName").value = data.user.full_name;
    applyProfileToForm({ ...data.profile, full_name_hint: data.user.full_name });

    const approved = data.user.account_status === "approved";
    showEl(els.appPanel, approved);
    showEl(els.workPanel, approved);
    showEl(els.planSection, approved && plan.length > 0);
    showEl(els.logSection, approved && plan.length > 0);
    showEl(els.feedbackSection, approved);
    showEl(els.dashboardSection, approved);

    const isAdmin = data.user.role === "admin" && approved;
    showEl(els.adminPanel, isAdmin);
    showEl(els.adminCatalogPanel, isAdmin);
    if (isAdmin) {
      await refreshAdminQueue();
      await refreshAdminCatalog();
    }

    setAuthState(`Signed in as ${data.user.full_name} (${data.user.account_status}).`, "success");
  } catch (e) {
    if (e.message === "Invalid token" || e.message === "Missing token") {
      authToken = "";
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      currentUser = null;
      setAuthState("Session expired. Please sign in again.", "error");
      showEl(els.appPanel, false);
      showEl(els.adminPanel, false);
      showEl(els.adminCatalogPanel, false);
    } else {
      setAuthState(`Could not load profile: ${e.message}`, "error");
    }
  }
}

async function refreshAdminQueue() {
  try {
    const rows = await api("/api/admin/pending-users", { headers: authHeaders() });
    els.adminTable.innerHTML = "";
    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="muted">No pending users.</td>`;
      els.adminTable.appendChild(tr);
      return;
    }
    rows.forEach((u) => {
      const tr = document.createElement("tr");
      const when = u.created_at ? new Date(u.created_at).toLocaleString() : "";
      tr.innerHTML = `<td>${escapeHtml(u.full_name)}</td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(when)}</td><td class="admin-actions"></td>`;
      const cell = tr.querySelector(".admin-actions");
      const approve = document.createElement("button");
      approve.type = "button";
      approve.textContent = "Approve";
      approve.addEventListener("click", () => moderateUser(u.id, "approve"));
      const reject = document.createElement("button");
      reject.type = "button";
      reject.textContent = "Reject";
      reject.className = "danger";
      reject.addEventListener("click", () => moderateUser(u.id, "reject"));
      cell.appendChild(approve);
      cell.appendChild(reject);
      els.adminTable.appendChild(tr);
    });
  } catch (e) {
    setAuthState(`Admin queue error: ${e.message}`, "error");
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function moderateUser(id, action) {
  const path = action === "approve" ? `/api/admin/users/${id}/approve` : `/api/admin/users/${id}/reject`;
  await api(path, { method: "POST", headers: authHeaders(), body: "{}" });
  await refreshAdminQueue();
}

function arrToCsv(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join(", ");
}

function clearRefEditor() {
  document.getElementById("admRefId").value = "";
  document.getElementById("admRefCategory").value = "";
  document.getElementById("admRefSlug").value = "";
  document.getElementById("admRefLabel").value = "";
  document.getElementById("admRefSort").value = "0";
  document.getElementById("admRefMeta").value = "{}";
  document.getElementById("admRefActive").checked = true;
}

function fillRefEditor(row) {
  document.getElementById("admRefId").value = row.id;
  document.getElementById("admRefCategory").value = row.category;
  document.getElementById("admRefSlug").value = row.slug;
  document.getElementById("admRefLabel").value = row.label;
  document.getElementById("admRefSort").value = String(row.sort_order ?? 0);
  document.getElementById("admRefMeta").value = JSON.stringify(row.meta || {}, null, 2);
  document.getElementById("admRefActive").checked = row.active !== false;
}

function clearExEditor() {
  document.getElementById("admExId").value = "";
  document.getElementById("admExSlug").value = "";
  document.getElementById("admExName").value = "";
  document.getElementById("admExMinExp").value = "0";
  document.getElementById("admExMaxExp").value = "2";
  document.getElementById("admExSets").value = "3";
  document.getElementById("admExReps").value = "8–12";
  document.getElementById("admExRir").value = "2";
  document.getElementById("admExRest").value = "90";
  document.getElementById("admExMuscles").value = "";
  document.getElementById("admExEquip").value = "";
  document.getElementById("admExGoals").value = "";
  document.getElementById("admExLoadMeta").value = "{}";
  document.getElementById("admExActive").checked = true;
}

function fillExEditor(row) {
  document.getElementById("admExId").value = row.id;
  document.getElementById("admExSlug").value = row.slug;
  document.getElementById("admExName").value = row.name;
  document.getElementById("admExMinExp").value = String(row.min_experience_sort ?? 0);
  document.getElementById("admExMaxExp").value = String(row.max_experience_sort ?? 2);
  document.getElementById("admExSets").value = String(row.sets_default ?? 3);
  document.getElementById("admExReps").value = row.reps_scheme || "";
  document.getElementById("admExRir").value = String(row.rir_default ?? 2);
  document.getElementById("admExRest").value = String(row.rest_seconds ?? 90);
  document.getElementById("admExMuscles").value = arrToCsv(row.muscle_targets);
  document.getElementById("admExEquip").value = arrToCsv(row.required_equipment_slugs);
  document.getElementById("admExGoals").value = arrToCsv(row.goal_slugs);
  document.getElementById("admExLoadMeta").value = JSON.stringify(row.load_meta || {}, null, 2);
  document.getElementById("admExActive").checked = row.active !== false;
}

async function refreshAdminCatalog() {
  if (!authToken) return;
  try {
    const refRows = await api("/api/admin/reference-options", { headers: authHeaders() });
    const exRows = await api("/api/admin/exercises", { headers: authHeaders() });
    const refBody = document.querySelector("#adminRefTable tbody");
    refBody.innerHTML = "";
    refRows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.slug)}</td><td>${escapeHtml(r.label)}</td><td>${r.sort_order}</td><td>${
        r.active ? "yes" : "no"
      }</td><td class="admin-actions"></td>`;
      const cell = tr.querySelector(".admin-actions");
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => fillRefEditor(r));
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Deactivate";
      del.className = "danger";
      del.addEventListener("click", async () => {
        if (!confirm("Deactivate this reference row? It will disappear from public dropdowns.")) return;
        await api(`/api/admin/reference-options/${r.id}`, { method: "DELETE", headers: authHeaders() });
        await refreshAdminCatalog();
        await loadCatalog();
      });
      cell.appendChild(edit);
      cell.appendChild(del);
      refBody.appendChild(tr);
    });

    const exBody = document.querySelector("#adminExTable tbody");
    exBody.innerHTML = "";
    exRows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.slug)}</td><td>${escapeHtml(arrToCsv(r.goal_slugs))}</td><td>${
        r.active ? "yes" : "no"
      }</td><td class="admin-actions"></td>`;
      const cell = tr.querySelector(".admin-actions");
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => fillExEditor(r));
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Deactivate";
      del.className = "danger";
      del.addEventListener("click", async () => {
        if (!confirm("Deactivate this exercise? It will no longer appear in generated plans.")) return;
        await api(`/api/admin/exercises/${r.id}`, { method: "DELETE", headers: authHeaders() });
        await refreshAdminCatalog();
        await loadCatalog();
      });
      cell.appendChild(edit);
      cell.appendChild(del);
      exBody.appendChild(tr);
    });
  } catch (e) {
    setAuthState(`Catalog admin error: ${e.message}`, "error");
  }
}

function renderPlan() {
  const tbody = document.querySelector("#planTable tbody");
  tbody.innerHTML = "";
  plan.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(p.exercise)}</td><td>${p.sets}</td><td>${escapeHtml(p.reps)}</td><td>${p.weight}</td><td>${p.rir}</td><td>${p.rest}</td>`;
    tbody.appendChild(tr);
  });
}

function firstRepHint(reps) {
  const part = String(reps).split(/[–\-/]/)[0];
  const n = parseInt(part.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : 8;
}

function renderLogTable() {
  const tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = "";
  plan.forEach((p, i) => {
    const tr = document.createElement("tr");
    const hint = firstRepHint(p.reps);
    tr.innerHTML = `<td>${escapeHtml(p.exercise)}</td><td>${p.sets}×${escapeHtml(p.reps)} @ ${p.weight}</td><td><input id="reps-${i}" type="number" min="0" value="${hint}"/></td><td><input id="weight-${i}" type="number" min="0" step="0.5" value="${p.weight}"/></td><td><input id="rir-${i}" type="number" min="0" max="6" value="${p.rir}"/></td><td><select id="done-${i}"><option value="true">Yes</option><option value="false">No</option></select></td><td><input id="note-${i}" placeholder="optional"/></td>`;
    tbody.appendChild(tr);
  });
}

function renderDashboard() {
  const root = document.getElementById("dashboard");
  const total = sessions.length;
  const adherence = total ? Math.round((sessions.filter((s) => s.completion_percent >= 80).length / total) * 100) : 0;
  const volume = sessions.reduce((acc, s) => acc + Number(s.total_volume || 0), 0);
  const readiness = total ? (sessions.reduce((acc, s) => acc + Number(s.readiness_score || 0), 0) / total).toFixed(1) : "0.0";
  root.innerHTML = `<div class="stat"><div class="label">Sessions</div><div class="value">${total}</div></div><div class="stat"><div class="label">Adherence</div><div class="value">${adherence}%</div></div><div class="stat"><div class="label">Total volume</div><div class="value">${Math.round(volume)}</div></div><div class="stat"><div class="label">Avg readiness</div><div class="value">${readiness}/10</div></div>`;
}

async function refreshSessions() {
  if (!authToken) return;
  try {
    const data = await api("/api/sessions", { headers: authHeaders() });
    sessions.length = 0;
    sessions.push(...data);
    renderDashboard();
  } catch (e) {
    if (e.code !== "PENDING_APPROVAL") setAuthState(`Could not load sessions: ${e.message}`, "error");
  }
}

function evaluateFallbackFeedback(session) {
  const msg = [];
  if (session.painFlag) msg.push("<span class='tag-bad'>Pain reported: avoid progression and review alternatives.</span>");
  if (session.completion >= 90 && Math.abs(session.rirDeltaAvg) <= 1) msg.push("<span class='tag-good'>Execution matched targets.</span>");
  if (session.rirDeltaAvg > 1) msg.push("<span class='tag-warn'>Easier than planned — consider a small load increase if form stays solid.</span>");
  if (session.rirDeltaAvg < -1) msg.push("<span class='tag-bad'>Harder than planned — hold or reduce load next time.</span>");
  if (!msg.length) msg.push("Session logged.");
  return msg.map((m) => `• ${m}`).join("<br/>");
}

document.getElementById("registerBtn").addEventListener("click", async () => {
  els.registerNotice.classList.add("hidden");
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const fullName = document.getElementById("authName").value.trim();
  if (!email || !password) {
    setAuthState("Enter your email and password to create an account.", "error");
    return;
  }
  if (!fullName) {
    setAuthState("Enter your full name — it is required for registration.", "error");
    return;
  }
  try {
    const data = await api("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    if (data.pendingApproval) {
      authToken = "";
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      currentUser = null;
      els.registerNotice.textContent = data.message || "An administrator will need to approve your account before you can sign in.";
      els.registerNotice.className = "notice notice-positive";
      els.registerNotice.classList.remove("hidden");
      setAuthState("Registered — awaiting approval before you can sign in.", "success");
      showEl(els.appPanel, false);
      return;
    }
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(currentUser));
    setAuthState(`Signed in as ${currentUser.full_name}.`, "success");
    await refreshMe();
    await refreshSessions();
  } catch (e) {
    setAuthState(e.message, "error");
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  els.registerNotice.classList.add("hidden");
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  if (!email || !password) {
    setAuthState("Enter your email and password to sign in.", "error");
    return;
  }
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(currentUser));
    setAuthState(`Signed in as ${currentUser.full_name}.`, "success");
    await refreshMe();
    await refreshSessions();
  } catch (e) {
    if (e.code === "PENDING_APPROVAL") {
      setAuthState("Your account is still waiting for administrator approval.", "error");
    } else if (e.code === "REJECTED") {
      setAuthState("This account was not approved. Contact your administrator if this is a mistake.", "error");
    } else {
      setAuthState(e.message, "error");
    }
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  authToken = "";
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  plan.length = 0;
  els.registerNotice.classList.add("hidden");
  setAuthState("Signed out.", "muted");
  showEl(els.appPanel, false);
  showEl(els.workPanel, false);
  showEl(els.planSection, false);
  showEl(els.logSection, false);
  showEl(els.feedbackSection, false);
  showEl(els.dashboardSection, false);
  showEl(els.adminPanel, false);
  showEl(els.adminCatalogPanel, false);
});

document.getElementById("saveProfile").addEventListener("click", async () => {
  if (!authToken) return alert("Sign in first.");
  try {
    await api("/api/profile", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        fullName: document.getElementById("fullName").value,
        age: document.getElementById("age").value,
        heightCm: document.getElementById("heightCm").value,
        weightKg: document.getElementById("weightKg").value,
        sexSlug: document.getElementById("sexSlug").value || null,
        goalSlug: document.getElementById("goalSlug").value || null,
        experienceSlug: document.getElementById("experienceSlug").value || null,
        daysPerWeek: document.getElementById("daysPerWeek").value,
        sessionDurationMin: document.getElementById("sessionDurationMin").value,
        occupationActivitySlug: document.getElementById("occupationActivitySlug").value || null,
        sleepTypicalHours: document.getElementById("sleepTypicalHours").value,
        equipmentSlugs: getCheckedSlugs("#equipmentChecks"),
        focusMuscleSlugs: getCheckedSlugs("#focusChecks"),
        injuriesLimitations: document.getElementById("injuriesLimitations").value,
        medicationsNotes: document.getElementById("medicationsNotes").value,
        trainingNotes: document.getElementById("trainingNotes").value,
        profileCompleted: document.getElementById("profileCompleted").checked,
      }),
    });
    alert("Profile saved.");
    await refreshMe();
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById("generatePlan").addEventListener("click", async () => {
  if (!authToken) return alert("Sign in first.");
  try {
    const data = await api("/api/plans/generate", { method: "POST", headers: authHeaders(), body: "{}" });
    plan.length = 0;
    plan.push(...data.plan);
    els.planMeta.textContent = `Built ${plan.length} movements from your profile (server target ${data.meta?.targetCount ?? "—"}). Loads are suggestions — adjust to how you feel.`;
    renderPlan();
    renderLogTable();
    showEl(els.planSection, true);
    showEl(els.logSection, true);
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById("submitSession").addEventListener("click", async () => {
  if (!authToken) return alert("Sign in first.");
  if (!plan.length) return alert("Generate a workout first.");

  const readiness = readinessPayload();
  let totalPlannedSets = 0;
  let doneSets = 0;
  let volume = 0;
  let rirDelta = 0;
  let painFlag = readiness.pain;
  const exercises = [];

  plan.forEach((p, i) => {
    const actualReps = Number(document.getElementById(`reps-${i}`).value || 0);
    const actualWeight = Number(document.getElementById(`weight-${i}`).value || 0);
    const actualRir = Number(document.getElementById(`rir-${i}`).value || 0);
    const completed = document.getElementById(`done-${i}`).value === "true";
    const notes = document.getElementById(`note-${i}`).value.trim();
    if (notes.toLowerCase().includes("pain")) painFlag = true;

    totalPlannedSets += p.sets;
    if (completed) doneSets += p.sets;
    volume += completed ? actualWeight * actualReps * p.sets : 0;
    rirDelta += p.rir - actualRir;

    exercises.push({
      exerciseId: p.exerciseId,
      exerciseSlug: p.slug,
      exercise: p.exercise,
      plannedSets: p.sets,
      plannedReps: p.reps,
      plannedWeight: p.weight,
      plannedRir: p.rir,
      actualReps,
      actualWeight,
      actualRir,
      completed,
      notes,
    });
  });

  const session = {
    completion: Math.round((doneSets / totalPlannedSets) * 100),
    volume,
    rirDeltaAvg: rirDelta / plan.length,
    readiness: readinessScore(readiness),
    painFlag,
  };

  const planSnapshot = {
    generatedAt: new Date().toISOString(),
    items: plan.map((p) => ({ slug: p.slug, name: p.exercise, sets: p.sets, reps: p.reps, weight: p.weight })),
  };

  try {
    const data = await api("/api/sessions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ readiness, session, exercises, planSnapshot }),
    });
    document.getElementById("feedback").classList.remove("empty");
    document.getElementById("feedback").innerHTML = `<strong>Coach note</strong><br/>${(data.feedback || "").replace(/\n/g, "<br/>") || evaluateFallbackFeedback(session)}`;
    await refreshSessions();
  } catch (e) {
    document.getElementById("feedback").classList.remove("empty");
    document.getElementById("feedback").innerHTML = `<strong>Offline feedback</strong><br/>${evaluateFallbackFeedback(session)}<br/><br/><span class='tag-warn'>Save failed: ${escapeHtml(e.message)}</span>`;
  }
});

document.getElementById("refreshAdminBtn").addEventListener("click", refreshAdminQueue);

document.getElementById("refreshCatalogAdminBtn").addEventListener("click", async () => {
  await refreshAdminCatalog();
  await loadCatalog();
});

document.getElementById("admRefNew").addEventListener("click", clearRefEditor);
document.getElementById("admRefSave").addEventListener("click", async () => {
  if (!authToken) return;
  let meta;
  try {
    meta = JSON.parse(document.getElementById("admRefMeta").value || "{}");
  } catch {
    alert("Meta must be valid JSON.");
    return;
  }
  const payload = {
    category: document.getElementById("admRefCategory").value.trim(),
    slug: document.getElementById("admRefSlug").value.trim(),
    label: document.getElementById("admRefLabel").value.trim(),
    sortOrder: Number(document.getElementById("admRefSort").value || 0),
    meta,
    active: document.getElementById("admRefActive").checked,
  };
  const id = document.getElementById("admRefId").value.trim();
  try {
    if (id) {
      await api(`/api/admin/reference-options/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
    } else {
      await api("/api/admin/reference-options", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
    }
    await refreshAdminCatalog();
    await loadCatalog();
    alert("Saved reference row.");
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById("admExNew").addEventListener("click", clearExEditor);
document.getElementById("admExSave").addEventListener("click", async () => {
  if (!authToken) return;
  let loadMeta;
  try {
    loadMeta = JSON.parse(document.getElementById("admExLoadMeta").value || "{}");
  } catch {
    alert("Load meta must be valid JSON.");
    return;
  }
  const payload = {
    slug: document.getElementById("admExSlug").value.trim(),
    name: document.getElementById("admExName").value.trim(),
    minExperienceSort: Number(document.getElementById("admExMinExp").value || 0),
    maxExperienceSort: Number(document.getElementById("admExMaxExp").value || 2),
    setsDefault: Number(document.getElementById("admExSets").value || 3),
    repsScheme: document.getElementById("admExReps").value.trim(),
    rirDefault: Number(document.getElementById("admExRir").value || 2),
    restSeconds: Number(document.getElementById("admExRest").value || 90),
    muscleTargets: document.getElementById("admExMuscles").value,
    requiredEquipmentSlugs: document.getElementById("admExEquip").value,
    goalSlugs: document.getElementById("admExGoals").value,
    loadMeta,
    active: document.getElementById("admExActive").checked,
  };
  const id = document.getElementById("admExId").value.trim();
  try {
    if (id) {
      await api(`/api/admin/exercises/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
    } else {
      await api("/api/admin/exercises", { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
    }
    await refreshAdminCatalog();
    await loadCatalog();
    alert("Saved exercise.");
  } catch (e) {
    alert(e.message);
  }
});

function setDefaultReadinessInputs() {
  document.getElementById("sleep").value = "7";
  document.getElementById("energy").value = "7";
  document.getElementById("soreness").value = "4";
  document.getElementById("stress").value = "5";
  document.getElementById("motivation").value = "8";
  document.getElementById("pain").value = "false";
}

const apiBaseSaveBtn = document.getElementById("apiBaseSave");
const apiBaseClearBtn = document.getElementById("apiBaseClear");
if (apiBaseSaveBtn) apiBaseSaveBtn.addEventListener("click", () => saveApiBaseFromForm());
if (apiBaseClearBtn) apiBaseClearBtn.addEventListener("click", () => clearApiBaseAndRetry());

(async function init() {
  syncApiBaseUrlField();
  try {
    await loadCatalog();
    await bootstrapAfterCatalogLoaded();
  } catch (e) {
    const extra =
      /No WorkoutOS API|WORKOUTOS_API_BASE|static hosting|another domain/i.test(e.message)
        ? ""
        : " If the API is running, check NEON_DATABASE_URL and run db schema + migrate + seed.";
    setAuthState(`Could not load catalog: ${e.message}${extra}`, "error");
    if (/No WorkoutOS API/i.test(e.message)) openApiBasePanel();
  }
})();
