// ============================================================
// ui.js — UI Controller
// The part that makes this stand out:
//   Every agent bubble has an expandable "🧠 Reasoning" trace
//   Supervisor panel updates in real-time with risk score,
//   live signals, policy cited, and action log.
// ============================================================

const $ = id => document.getElementById(id);

// ── DOM refs ─────────────────────────────────────────────────
const msgList         = $("msgList");
const messages        = $("messages");
const welcome         = $("welcome");
const userInput       = $("userInput");
const sendBtn         = $("sendBtn");
const typing          = $("typing");
const phaseTag        = $("phaseTag");
const charCount       = $("charCount");
const angerMeter      = $("angerMeter");
const angerFill       = $("angerFill");
const angerVal        = $("angerVal");
const statusDot       = $("statusDot");
const statusLabel     = $("statusLabel");
const sessionIdDisplay= $("sessionIdDisplay");

// Supervisor refs
const riskArc         = $("riskArc");
const riskNum         = $("riskNum");
const riskLevel       = $("riskLevel");
const riskReason      = $("riskReason");
const sigPhase        = $("sigPhase");
const sigTurns        = $("sigTurns");
const sigTier         = $("sigTier");
const sigAnger        = $("sigAnger");
const sigConfidence   = $("sigConfidence");
const sigActions      = $("sigActions");
const policyName      = $("policyName");
const policyText      = $("policyText");
const actionLog       = $("actionLog");

const PHASE_LABELS = {
  IDENTIFY:  "Phase: Identifying customer",
  ACTIVE:    "Phase: Active — resolving",
  ESCALATED: "Phase: Escalated ⚠️",
};

// ── MARKDOWN-LITE RENDERER ───────────────────────────────────
function md(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n(?!<\/?[uo]l)/g, "<br>");
}

// ── SHOW CHAT (hide welcome) ──────────────────────────────────
function showChat() {
  if (welcome.style.display !== "none") {
    welcome.style.display = "none";
    messages.style.display = "flex";
  }
}

// ── ADD MESSAGE ───────────────────────────────────────────────
// speaker: "agent" | "user" | "supervisor"
// opts: { reasoning, policyId, action, confidence, escalated, issued }
function addMessage(speaker, text, opts = {}) {
  showChat();
  logAudit(speaker, text, opts.reasoning || []);

  const row = document.createElement("div");
  row.className = `msg-row ${speaker}`;

  // Avatar
  const av = document.createElement("div");
  av.className = `msg-avatar ${speaker}`;
  av.textContent = speaker === "agent" ? "🤖" : speaker === "supervisor" ? "👮" : "👤";

  // Body col
  const body = document.createElement("div");
  body.className = "msg-body";

  // Bubble
  const bubble = document.createElement("div");
  bubble.className = `bubble ${speaker}`;
  if (opts.escalated) bubble.classList.add("escalated");
  if (opts.issued)    bubble.classList.add("issued");
  bubble.innerHTML = md(text);

  body.appendChild(bubble);

  // Reasoning trace (agent only, if reasoning steps exist)
  if (speaker === "agent" && opts.reasoning && opts.reasoning.length > 0) {
    const toggle = document.createElement("div");
    toggle.className = "reasoning-toggle";
    toggle.innerHTML = `<span class="arrow">▶</span> 🧠 See reasoning (${opts.reasoning.length} steps)`;

    const panel = document.createElement("div");
    panel.className = "reasoning-panel";

    opts.reasoning.forEach((r, i) => {
      const step = document.createElement("div");
      step.className = "r-step";
      step.innerHTML = `
        <div class="r-num">${i + 1}</div>
        <div class="r-content">
          <div class="r-label">${r.step}</div>
          <div class="r-obs">${r.observation}</div>
          <div class="r-conc">→ ${r.conclusion}</div>
        </div>`;
      panel.appendChild(step);
    });

    // Policy link
    if (opts.policyId && DATA.policies[opts.policyId]) {
      const pol = DATA.policies[opts.policyId];
      const link = document.createElement("div");
      link.className = "r-policy-link";
      link.textContent = `📜 Policy: ${pol.title}`;
      panel.appendChild(link);
    }

    toggle.addEventListener("click", () => {
      toggle.classList.toggle("open");
      panel.classList.toggle("visible");
      toggle.querySelector(".arrow").textContent = panel.classList.contains("visible") ? "▼" : "▶";
      toggle.querySelector("span:last-child") && (toggle.innerHTML = `<span class="arrow">${panel.classList.contains("visible") ? "▼" : "▶"}</span> 🧠 ${panel.classList.contains("visible") ? "Hide" : "See"} reasoning (${opts.reasoning.length} steps)`);
      // Redraw the arrow correctly
      toggle.innerHTML = `<span class="arrow">${panel.classList.contains("visible") ? "▼" : "▶"}</span> 🧠 ${panel.classList.contains("visible") ? "Hide" : "See"} reasoning (${opts.reasoning.length} steps)`;
      toggle.addEventListener("click", arguments.callee); // will double-bind, fix below
    });
    // Re-bind cleanly
    toggle.onclick = () => {
      const isOpen = panel.classList.toggle("visible");
      toggle.innerHTML = `<span class="arrow">${isOpen ? "▼" : "▶"}</span> 🧠 ${isOpen ? "Hide" : "See"} reasoning (${opts.reasoning.length} steps)`;
    };

    body.appendChild(toggle);
    body.appendChild(panel);
  }

  // Timestamp
  const ts = document.createElement("div");
  ts.className = "msg-time";
  ts.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  body.appendChild(ts);

  row.appendChild(av);
  row.appendChild(body);
  msgList.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

// ── TYPING SIMULATION ────────────────────────────────────────
function simulateTyping(responseText) {
  sendBtn.disabled = true;
  userInput.disabled = true;
  typing.style.display = "flex";
  messages.scrollTop = messages.scrollHeight;

  const delay = Math.min(1800, Math.max(500, responseText.length * 10));
  return new Promise(resolve => {
    setTimeout(() => {
      typing.style.display = "none";
      sendBtn.disabled = false;
      userInput.disabled = false;
      userInput.focus();
      resolve();
    }, delay);
  });
}

// ── UPDATE UI STATE ───────────────────────────────────────────
function updateUI(lastConfidence) {
  // Phase tag
  phaseTag.textContent = PHASE_LABELS[AGENT.phase] || "";

  // Status pill
  if (AGENT.phase === "ESCALATED") {
    statusDot.className = "status-dot escalated";
    statusLabel.textContent = "Escalated";
  } else {
    statusDot.className = "status-dot";
    statusLabel.textContent = "Agent Online";
  }

  // Session ID
  sessionIdDisplay.textContent = AGENT.sessionId;

  // Anger meter
  if (AGENT.angerLevel > 0) {
    angerMeter.style.display = "flex";
    const pct = Math.round((AGENT.angerLevel / 3) * 100);
    angerFill.style.width = pct + "%";
    angerFill.style.background = pct < 35 ? "var(--green)" : pct < 70 ? "var(--amber)" : "var(--red)";
    angerVal.textContent = pct + "%";
  }

  // Customer section
  if (AGENT.customer) {
    $("customerSection").style.display = "block";
    const c = AGENT.customer;
    $("customerDetails").innerHTML = `
      <div class="cust-row"><span class="cust-key">Name</span><span class="cust-val">${c.name}</span></div>
      <div class="cust-row"><span class="cust-key">Tier</span><span class="cust-val"><span class="tier-pill ${c.tier.toLowerCase()}">${c.tier}</span></span></div>
      <div class="cust-row"><span class="cust-key">PNR</span><span class="cust-val" style="font-family:var(--mono)">${c.pnr}</span></div>
      <div class="cust-row"><span class="cust-key">Flights (12mo)</span><span class="cust-val">${c.flightsLast12m}</span></div>
      <div class="cust-row"><span class="cust-key">Prior complaints</span><span class="cust-val">${c.priorComplaints.length}</span></div>
    `;
  }

  supervisorPanelUpdate(lastConfidence);
}

// ── SUPERVISOR PANEL UPDATE ───────────────────────────────────
// Called after every agent turn; also assigned to AGENT so agent.js can call it
function supervisorPanelUpdate(confidence) {
  // Risk ring
  const risk = AGENT.riskScore;
  const circ = 2 * Math.PI * 32; // r=32
  const offset = circ - (risk / 100) * circ;
  riskArc.setAttribute("stroke-dashoffset", offset.toFixed(1));
  riskArc.style.stroke = risk < 30 ? "var(--green)" : risk < 65 ? "var(--amber)" : "var(--red)";
  riskNum.textContent = risk;

  if (risk < 30) {
    riskLevel.textContent = "LOW RISK";
    riskLevel.className = "risk-level";
    riskReason.textContent = AGENT.phase === "IDENTIFY" ? "Awaiting customer" : "Conversation proceeding normally";
  } else if (risk < 65) {
    riskLevel.textContent = "MEDIUM RISK";
    riskLevel.className = "risk-level med";
    riskReason.textContent = "Elevated frustration or sensitive request";
  } else {
    riskLevel.textContent = "HIGH RISK";
    riskLevel.className = "risk-level high";
    riskReason.textContent = "Legal threat, prohibited action, or escalation";
  }

  // Signals
  sigPhase.textContent = AGENT.phase;
  sigTurns.textContent = AGENT.turnCount;
  sigTier.textContent = AGENT.customer?.tier || "—";
  sigAnger.textContent = AGENT.angerLevel.toFixed(1);
  sigConfidence.textContent = confidence != null ? confidence + "%" : "—";
  sigActions.textContent = AGENT.actionsLog.length;

  // Last policy cited
  const lastWithPolicy = [...AGENT.actionsLog].reverse().find(a => a.policyId);
  if (lastWithPolicy && DATA.policies[lastWithPolicy.policyId]) {
    const pol = DATA.policies[lastWithPolicy.policyId];
    policyName.textContent = pol.title;
    policyText.textContent = pol.text;
  }

  // Action log
  actionLog.innerHTML = "";
  [...AGENT.actionsLog].reverse().forEach(a => {
    const el = document.createElement("div");
    el.className = `al-item ${a.type}`;
    el.innerHTML = `<strong>${a.type}</strong> — ${a.detail}${a.policyId ? ` <em style="font-size:10px;opacity:.6">[${a.policyId}]</em>` : ""}<div class="al-ts">${a.ts}</div>`;
    actionLog.appendChild(el);
  });
}

// Make supervisorPanelUpdate accessible to agent.js
window.supervisorPanelUpdate = supervisorPanelUpdate;

// ── HANDLE SEND ───────────────────────────────────────────────
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  charCount.textContent = "0 / 600";
  userInput.style.height = "auto";

  addMessage("user", text);
  updateUI(null);

  const result = agentRespond(text);
  AGENT.riskScore = Math.max(0, Math.min(100, AGENT.riskScore + result.riskDelta));

  await simulateTyping(result.text);

  addMessage("agent", result.text, {
    reasoning: result.reasoning,
    policyId: result.reasoning?.find(r => r.policyId)?.policyId ||
              AGENT.actionsLog.slice(-1)[0]?.policyId || null,
    action: result.action,
    escalated: result.action === "ESCALATED",
    issued: result.action === "ISSUED",
  });

  updateUI(result.confidence);
}

// ── LOAD SCENARIO ─────────────────────────────────────────────
function loadScenario(key) {
  agentReset();

  // Clear chat
  msgList.innerHTML = "";
  welcome.style.display = "none";
  messages.style.display = "flex";

  // Reset sidebar
  $("customerSection").style.display = "none";
  angerMeter.style.display = "none";

  // Mark active card
  document.querySelectorAll(".scenario-card").forEach(c => c.classList.remove("active"));
  const card = document.querySelector(`[data-scenario="${key}"]`);
  if (card) card.classList.add("active");

  const scenario = DATA.scenarios[key];

  // Quick actions
  $("qaSection").style.display = "block";
  $("qaList").innerHTML = "";
  (scenario.quickActions || []).forEach(qa => {
    const btn = document.createElement("button");
    btn.className = "qa-btn";
    btn.textContent = qa.label;
    btn.onclick = () => {
      userInput.value = qa.msg;
      handleSend();
    };
    $("qaList").appendChild(btn);
  });

  // Agent greeting
  addMessage("agent",
    `Hello! Welcome to **SkyKing Airlines** support. I'm here to help with any disruptions to your travel plans.\n\nTo get started, could you please share your **booking reference (PNR)** or **full name**?`,
    {
      reasoning: [
        { step: "Phase", observation: "Session just started — no customer identified yet.", conclusion: "Ask for PNR or name to verify identity." },
        { step: "Policy", observation: "Allowed actions: 'Provide the customer's own booking and flight status information.'", conclusion: "Must identify customer first before accessing any booking data." },
      ]
    }
  );

  updateUI(100);

  // Auto-inject seed after short delay
  setTimeout(() => {
    userInput.value = scenario.seed;
    updateUI(100);
  }, 600);
}

// ── SUPERVISOR OVERRIDE ───────────────────────────────────────
$("overrideBtn").addEventListener("click", () => {
  const msg = $("overrideInput").value.trim();
  if (!msg) return;
  $("overrideInput").value = "";
  showChat();
  addMessage("supervisor", `⚡ SUPERVISOR: ${msg}`);
  logAudit("supervisor", msg);
});

// ── SUPERVISOR PANEL TOGGLE ───────────────────────────────────
$("toggleSupervisor").addEventListener("click", () => {
  const panel = $("panelRight");
  panel.classList.toggle("hidden");
  $("toggleSupervisor").style.background =
    panel.classList.contains("hidden") ? "var(--surface)" : "var(--acc-soft)";
  $("toggleSupervisor").style.color =
    panel.classList.contains("hidden") ? "" : "var(--acc)";
});

// ── SCENARIO CARDS ───────────────────────────────────────────
document.querySelectorAll(".scenario-card").forEach(card => {
  card.addEventListener("click", () => loadScenario(card.dataset.scenario));
});

// ── SEND BUTTON + ENTER KEY ───────────────────────────────────
sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});

// ── AUTO RESIZE TEXTAREA ─────────────────────────────────────
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(110, userInput.scrollHeight) + "px";
  charCount.textContent = `${userInput.value.length} / 600`;
});

// ── RESET ────────────────────────────────────────────────────
$("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset the conversation? All messages and state will be cleared.")) return;
  agentReset();
  msgList.innerHTML = "";
  welcome.style.display = "flex";
  messages.style.display = "none";
  $("customerSection").style.display = "none";
  $("qaSection").style.display = "none";
  angerMeter.style.display = "none";
  document.querySelectorAll(".scenario-card").forEach(c => c.classList.remove("active"));
  updateUI(null);
});

// ── AUDIT MODAL ───────────────────────────────────────────────
$("exportAuditBtn").addEventListener("click", () => {
  $("auditPre").textContent = agentExportAudit();
  $("auditOverlay").style.display = "flex";
});
const closeAudit = () => $("auditOverlay").style.display = "none";
$("auditClose").addEventListener("click", closeAudit);
$("auditClose2").addEventListener("click", closeAudit);
$("auditOverlay").addEventListener("click", e => { if (e.target === $("auditOverlay")) closeAudit(); });

$("downloadAudit").addEventListener("click", () => {
  const blob = new Blob([agentExportAudit()], { type: "text/plain" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `skyking-audit-${AGENT.sessionId}.txt`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

// ── ESC KEY ──────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeAudit();
});

// ── INIT ─────────────────────────────────────────────────────
updateUI(null);
userInput.focus();
