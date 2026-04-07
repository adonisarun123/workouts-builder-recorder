const plan = [];
const sessions = [];
let authToken = localStorage.getItem("token") || "";
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

const planRules = {
  "Muscle Gain": [["Back Squat",4,"6-10",135,2,150],["Bench Press",4,"6-10",115,2,120],["Romanian Deadlift",3,"8-12",95,2,120],["Lat Pulldown",3,"10-12",90,2,90],["Cable Lateral Raise",3,"12-15",20,2,60]],
  "Strength Gain": [["Back Squat",5,"3-6",165,2,180],["Bench Press",5,"3-6",145,2,180],["Deadlift",3,"3-5",205,2,210],["Barbell Row",4,"5-8",115,2,120],["Plank",3,"45-60s",0,2,60]],
  "Fat Loss": [["Goblet Squat",3,"10-15",45,3,75],["Incline DB Press",3,"10-12",35,3,75],["Seated Row",3,"10-12",80,3,75],["Walking Lunge",3,"12/leg",25,3,75],["Bike Intervals",6,"30/60",0,4,30]],
  "Recomposition": [["Leg Press",4,"8-12",180,2,120],["Dumbbell Bench",4,"8-12",50,2,120],["Chest Supported Row",4,"8-12",70,2,120],["Hip Thrust",3,"10-12",135,2,90],["Cable Crunch",3,"12-15",60,2,60]]
};

function setAuthState(message) {
  document.getElementById("authState").textContent = message;
}

function readinessPayload() {
  return {
    sleep: Number(document.getElementById("sleep").value || 0),
    energy: Number(document.getElementById("energy").value || 0),
    soreness: Number(document.getElementById("soreness").value || 0),
    stress: Number(document.getElementById("stress").value || 0),
    motivation: Number(document.getElementById("motivation").value || 0),
    pain: document.getElementById("pain").value === "Yes"
  };
}

function readinessScore(r) {
  return Math.max(0, Math.min(10, ((r.sleep / 8) * 2 + r.energy * 0.25 + r.motivation * 0.2 + (11 - r.soreness) * 0.18 + (11 - r.stress) * 0.17 + (r.pain ? -2 : 0))));
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` };
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function renderPlan() {
  const tbody = document.querySelector("#planTable tbody");
  tbody.innerHTML = "";
  plan.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.exercise}</td><td>${p.sets}</td><td>${p.reps}</td><td>${p.weight}</td><td>${p.rir}</td><td>${p.rest}s</td>`;
    tbody.appendChild(tr);
  });
}

function renderLogTable() {
  const tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = "";
  plan.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.exercise}</td><td>${p.sets}x${p.reps} @ ${p.weight}</td><td><input id="reps-${i}" type="number" min="0" value="${p.reps.split("-")[0].replace(/[^0-9]/g,"") || 8}"/></td><td><input id="weight-${i}" type="number" min="0" value="${p.weight}"/></td><td><input id="rir-${i}" type="number" min="0" max="6" value="${p.rir}"/></td><td><select id="done-${i}"><option>Yes</option><option>No</option></select></td><td><input id="note-${i}" placeholder="optional"/></td>`;
    tbody.appendChild(tr);
  });
}

function renderDashboard() {
  const root = document.getElementById("dashboard");
  const total = sessions.length;
  const adherence = total ? Math.round((sessions.filter((s) => s.completion_percent >= 80).length / total) * 100) : 0;
  const volume = sessions.reduce((acc, s) => acc + Number(s.total_volume || 0), 0);
  const readiness = total ? (sessions.reduce((acc, s) => acc + Number(s.readiness_score || 0), 0) / total).toFixed(1) : "0.0";
  root.innerHTML = `<div class="stat"><div class="label">Sessions</div><div class="value">${total}</div></div><div class="stat"><div class="label">Adherence</div><div class="value">${adherence}%</div></div><div class="stat"><div class="label">Total Volume</div><div class="value">${Math.round(volume)}</div></div><div class="stat"><div class="label">Avg Readiness</div><div class="value">${readiness}/10</div></div>`;
}

function evaluateFallbackFeedback(session) {
  const msg = [];
  if (session.painFlag) msg.push("<span class='tag-bad'>Pain reported: avoid progression and review exercise alternatives.</span>");
  if (session.completion >= 90 && Math.abs(session.rirDeltaAvg) <= 1) msg.push("<span class='tag-good'>Great execution. Intensity matched target.</span>");
  if (session.rirDeltaAvg > 1) msg.push("<span class='tag-warn'>Potentially too easy. Increase load 2.5–5% if form is stable.</span>");
  if (session.rirDeltaAvg < -1) msg.push("<span class='tag-bad'>Harder than planned. Hold/reduce load next workout.</span>");
  if (!msg.length) msg.push("Session logged.");
  return msg.map((m) => `• ${m}`).join("<br/>");
}

async function refreshSessions() {
  if (!authToken) return;
  try {
    const data = await api("/api/sessions", { headers: authHeaders() });
    sessions.length = 0;
    sessions.push(...data);
    renderDashboard();
  } catch (error) {
    setAuthState(`Failed to load logs: ${error.message}`);
  }
}

document.getElementById("registerBtn").addEventListener("click", async () => {
  try {
    const data = await api("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: document.getElementById("authName").value,
        email: document.getElementById("authEmail").value,
        password: document.getElementById("authPassword").value
      })
    });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(currentUser));
    setAuthState(`Logged in as ${currentUser.full_name}`);
    await refreshSessions();
  } catch (error) {
    setAuthState(error.message);
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: document.getElementById("authEmail").value, password: document.getElementById("authPassword").value })
    });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(currentUser));
    setAuthState(`Logged in as ${currentUser.full_name}`);
    await refreshSessions();
  } catch (error) {
    setAuthState(error.message);
  }
});

document.getElementById("saveProfile").addEventListener("click", async () => {
  if (!authToken) return alert("Please login first.");
  await api("/api/profile", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      fullName: document.getElementById("name").value,
      goal: document.getElementById("goal").value,
      experience: document.getElementById("experience").value,
      age: Number(document.getElementById("age").value),
      equipment: document.getElementById("equipment").value,
      daysPerWeek: Number(document.getElementById("days").value),
      maxDuration: Number(document.getElementById("duration").value),
      injuries: document.getElementById("injury").value
    })
  });
  alert("Profile saved to Neon.");
});

document.getElementById("generatePlan").addEventListener("click", () => {
  const goal = document.getElementById("goal").value;
  const experience = document.getElementById("experience").value;
  const modifier = experience === "Beginner" ? 0.9 : experience === "Advanced" ? 1.1 : 1;

  plan.length = 0;
  (planRules[goal] || []).forEach(([exercise, sets, reps, weight, rir, rest]) => plan.push({ exercise, sets, reps, weight: Math.round(weight * modifier), rir, rest }));

  renderPlan();
  renderLogTable();
});

document.getElementById("submitSession").addEventListener("click", async () => {
  if (!authToken) return alert("Please login first.");
  if (!plan.length) return alert("Generate a plan first.");

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
    const completed = document.getElementById(`done-${i}`).value === "Yes";
    const notes = document.getElementById(`note-${i}`).value.trim();
    if (notes.toLowerCase().includes("pain")) painFlag = true;

    totalPlannedSets += p.sets;
    if (completed) doneSets += p.sets;
    volume += completed ? actualWeight * actualReps * p.sets : 0;
    rirDelta += (p.rir - actualRir);

    exercises.push({
      exercise: p.exercise,
      plannedSets: p.sets,
      plannedReps: p.reps,
      plannedWeight: p.weight,
      plannedRir: p.rir,
      actualReps,
      actualWeight,
      actualRir,
      completed,
      notes
    });
  });

  const session = {
    completion: Math.round((doneSets / totalPlannedSets) * 100),
    volume,
    rirDeltaAvg: rirDelta / plan.length,
    readiness: readinessScore(readiness),
    painFlag
  };

  try {
    const data = await api("/api/sessions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ readiness, session, exercises })
    });
    document.getElementById("feedback").classList.remove("empty");
    document.getElementById("feedback").innerHTML = `<strong>AI Feedback</strong><br/>${data.feedback?.replace(/\n/g, "<br/>") || evaluateFallbackFeedback(session)}`;
    await refreshSessions();
  } catch (error) {
    document.getElementById("feedback").classList.remove("empty");
    document.getElementById("feedback").innerHTML = `<strong>Fallback Feedback</strong><br/>${evaluateFallbackFeedback(session)}<br/><br/><span class='tag-warn'>Database submit failed: ${error.message}</span>`;
  }
});

if (currentUser) {
  setAuthState(`Logged in as ${currentUser.full_name}`);
  refreshSessions();
} else {
  setAuthState("Not logged in.");
}

planRules["Muscle Gain"].forEach(([exercise, sets, reps, weight, rir, rest]) => plan.push({ exercise, sets, reps, weight, rir, rest }));
renderPlan();
renderLogTable();
renderDashboard();
