# ✈️ SkyKing Airlines — Customer Resolution Agent
### AIONOS Assignment 3 | Agentic AI Factory | Batch 2027

---

## ▶ Run It Instantly
```bash
# No install needed — just open in your browser:
open index.html

# Or serve with Python:
python3 -m http.server 8080
# → http://localhost:8080
```

---

## What Makes This Different

Everyone builds a chatbot. This is built differently — every agent response exposes its **full reasoning chain**: what intent was detected, which policy rule was checked, what action was taken or blocked, and why. A **Supervisor Command Centre** monitors the session in real-time with a live risk score, frustration meter, and override capability.

This reflects how enterprise AI is actually deployed: not as a black box, but as an **auditable, explainable, human-supervised system**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INPUT LAYER                           │
│   Customer message ──────────────── Quick scenario buttons  │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     PROCESSING LAYER                         │
│  ① Intent Recognition — 13 intent patterns (regex NLU)      │
│     REFUND · REBOOK · UPGRADE · HOTEL · FULL_NIGHT          │
│     LOUNGE · MEAL · STATUS · ESCALATE · LEGAL · FARE_DIFF   │
│  ② Anger Detection — keyword + punctuation scoring           │
│     Scales empathy prefix: calm → frustrated → furious       │
│  ③ Legal Threat Detection → immediate escalation (no bypass) │
│  ④ Customer Identification — PNR / name / email lookup       │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│   Customer Profiles (3 customers, tiers, complaint history) │
│   Booking Data       (PNR, routes, statuses, delays)        │
│   Service Policies   (5 rules with IDs — agent cites them)  │
│   Allowed / Prohibited action lists                         │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     DECISION LAYER                           │
│   State machine: IDENTIFY → ACTIVE → ESCALATED              │
│   Every decision produces a structured reasoning trace:      │
│     { step, observation, conclusion }  × N steps            │
│   Policy enforcement:                                        │
│     Delay < 3h     → meal voucher only                      │
│     Delay 3–5h     → meal + lounge                          │
│     Delay > 5h     → meal + lounge + hotel (delayed hrs)    │
│     Cancellation   → rebook OR full refund (choice)         │
│     Fare diff > ₹1,500 → escalate to supervisor             │
│     Upgrade/legal  → prohibited, escalate                   │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      OUTPUT LAYER                            │
│   Chat response with expandable 🧠 Reasoning trace          │
│   Supervisor panel: risk ring, signals, policy cited, log   │
│   Timestamped audit trail (downloadable .txt)               │
└─────────────────────────────────────────────────────────────┘
```

---

## The Three Scenarios

| Customer | Tier | PNR | Disruption | Key Decision Points |
|----------|------|-----|-----------|----------------------|
| Priya Nair | Gold | SK4821X | Flight SK-204 **cancelled** | Rebook or full refund ✅ · Business class upgrade ❌ (prohibited) · Legal threat → escalate |
| Arvind Kulkarni | Silver | TR1190B | SK-118 **delayed 4h** | Meal + lounge ✅ · Hotel ❌ (4h < 5h threshold) |
| Meher Kaur | Platinum | WL7742 | SK-305 **delayed 6h** | Meal + lounge + hotel (delayed hrs) ✅ · Full night hotel ❌ · Fare diff ₹2,000 > ₹1,500 → escalate |

---

## Design Decisions That Show Judgment

**1. Reasoning traces, not just answers**
Every response includes a 3–5 step chain-of-thought that cites the exact policy rule. An interviewer can click "🧠 See reasoning" on any bubble and trace every decision. This is what explainable AI looks like in practice.

**2. Supervisor Command Centre**
A real deployment has humans in the loop. The supervisor panel shows live risk score (0–100), frustration level, last policy cited, and an action log. The override button lets a human inject a message into the conversation. This shows understanding of production AI systems.

**3. No hallucination — ever**
The agent only uses data from the data pack. If something isn't in the data, the agent says so. The `DATA` object is the single source of truth, and every policy response cites its `policyId`.

**4. Authority boundaries are hard**
- Upgrade requests: always denied (Prohibited Actions list)
- Fare diff > ₹1,500: always escalated (Fare Difference Rule, agent limit = ₹1,500)
- Legal threats: immediately escalated, no exceptions
- Hotel for 4h delay: denied with explanation (threshold is 5h)

**5. Anger scales empathy, not policy**
Frustrated customers get more empathetic language — but the same policy decisions. The agent doesn't cave under pressure. That's the correct behaviour.

---

## File Structure

```
skyking-agent/
├── index.html   — 3-panel UI (scenarios · chat · supervisor)
├── data.js      — Complete data pack (customers, bookings, policies)
├── agent.js     — Reasoning engine (produces CoT traces per response)
├── ui.js        — UI controller (messages, supervisor panel, audit)
├── style.css    — Premium dark 3-panel layout
└── README.md    — This file
```

---

## Submission Checklist
- [x] Working agent — open `index.html`
- [x] All 3 scenarios with policy-grounded reasoning
- [x] Architecture documented (above + in-app)
- [x] Audit trail (click "Audit" in header → download)
- [x] AI tools used: Antigravity (AGY) for code generation
- [x] GitHub repo (this directory, `git init` done)
- [ ] Push to GitHub + enable GitHub Pages for shareable link
- [ ] Record demo video (see demo flow below)
- [ ] 10-slide PPT

---

## Demo Flow (for your video)

1. Open `index.html`
2. **Scenario 1 (Priya — Gold)** → seed auto-loads → agent greets with booking status + options
   - Click "I want a full refund" → see 4-step reasoning trace → refund initiated ✅
   - Click "I want a business class upgrade" → 4-step reasoning → upgrade declined ❌, alternatives offered
   - Click "Threaten legal action" → immediate escalation, case reference issued
   - Point to Supervisor Panel → show risk score jumping, action log updating live
3. **Reset** → **Scenario 2 (Arvind — Silver)** → seed loads
   - Click "I need hotel accommodation" → reasoning shows 4h < 5h threshold → denied ❌, meal+lounge issued ✅
4. **Reset** → **Scenario 3 (Meher — Platinum)**
   - Click "Apply all my compensation" → meal + lounge + hotel (delayed hrs) ✅
   - Click "I want a full night at a hotel" → denied with policy explanation
   - Click "Move me to earlier flight (₹2000 diff)" → escalation triggered (> ₹1,500 limit)
5. Click **Audit** → show full conversation trail → download
6. Point to **Supervisor Override** → inject a message → explain human-in-the-loop

**For interview defence:**
- "I didn't build a chatbot. I built an agent that knows what it can do, what it can't do, and shows every step of its reasoning — because enterprise AI has to be explainable and auditable."
