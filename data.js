// ============================================================
// DATA PACK — Assignment 3: Customer-Facing Resolution Agent
// Source: Assignment 3_DataPack_CustomerResolutionAgent.pdf
// Exercise date: Wednesday, 23 September 2026
// RULE: Do NOT invent rules, policies, or customer information
//       not grounded in this data pack.
// ============================================================

const DATA = {

  // ── 1. CUSTOMER PROFILES ──────────────────────────────────
  customers: {
    "SK4821X": {
      name: "Priya Nair",
      tier: "Gold",
      pnr: "SK4821X",
      email: "priya.nair@example.com",
      phone: "+91-98xxxxxxx1",
      flightsLast12m: 6,
      priorComplaints: ["Delayed baggage — resolved with voucher"],
    },
    "TR1190B": {
      name: "Arvind Kulkarni",
      tier: "Silver",
      pnr: "TR1190B",
      email: "arvind.kulkarni@example.com",
      phone: "+91-98xxxxxxx2",
      flightsLast12m: 3,
      priorComplaints: [],
    },
    "WL7742": {
      name: "Meher Kaur",
      tier: "Platinum",
      pnr: "WL7742",
      email: "meher.kaur@example.com",
      phone: "+91-98xxxxxxx3",
      flightsLast12m: 10,
      priorComplaints: ["Overbooking — resolved with tier-status upgrade"],
    },
  },

  // ── 2. BOOKING / TRANSACTION DATA ────────────────────────
  bookings: {
    "SK4821X": [
      {
        id: "SK4821X-1",
        flight: "SK-204",
        route: "Delhi → Goa",
        date: "Wed 23 Sep 2026",
        scheduledDep: "18:40",
        newDep: null,
        status: "CANCELLED",
        reason: "operational reasons",
        delayHours: null,
        isPrimary: true,
      },
      {
        id: "SK4821X-2",
        flight: "Return",
        route: "Goa → Delhi",
        date: "Fri 25 Sep 2026",
        scheduledDep: "16:20",
        newDep: null,
        status: "UNAFFECTED",
        reason: null,
        delayHours: null,
        isPrimary: false,
      },
    ],
    "TR1190B": [
      {
        id: "TR1190B-1",
        flight: "SK-118",
        route: "Mumbai → Bengaluru",
        date: "Wed 23 Sep 2026",
        scheduledDep: "07:10",
        newDep: "11:10",
        status: "DELAYED",
        reason: null,
        delayHours: 4,
        isPrimary: true,
      },
    ],
    "WL7742": [
      {
        id: "WL7742-1",
        flight: "SK-305",
        route: "Delhi → Hyderabad",
        date: "Wed 23 Sep 2026",
        scheduledDep: "14:00",
        newDep: "20:00",
        status: "DELAYED",
        reason: null,
        delayHours: 6,
        isPrimary: true,
      },
    ],
  },

  // ── 3. SERVICE RULES ─────────────────────────────────────
  // Each rule has an id, title, and text — so the agent can CITE them
  policies: {
    CANCELLATION_REBOOKING: {
      id: "CANCELLATION_REBOOKING",
      title: "Cancellation Rebooking Rule",
      text: "If a flight is cancelled by the airline, the customer is entitled to a free rebooking on the next available flight within 24 hours, or a full refund — customer's choice.",
    },
    DELAY_COMPENSATION: {
      id: "DELAY_COMPENSATION",
      title: "Delay Compensation Rule",
      text: "Delay under 3 hours: ₹500 meal voucher. Delay more than 3 hours: meal voucher + lounge access. Delay more than 5 hours: meal voucher + hotel accommodation covering only the delayed hours (not a full night's stay).",
      tiers: {
        under3h:  { label: "< 3h delay",  entitlements: ["₹500 meal voucher"] },
        over3h:   { label: "3–5h delay",  entitlements: ["₹500 meal voucher", "Lounge access"] },
        over5h:   { label: "> 5h delay",  entitlements: ["₹500 meal voucher", "Lounge access", "Hotel accommodation (delayed hours only — not a full night's stay)"] },
      },
    },
    REFUND_PROCESSING: {
      id: "REFUND_PROCESSING",
      title: "Refund Processing Rule",
      text: "Refunds for airline-caused cancellations are processed in full within 7 business days. Refunds are issued to the original payment method only.",
    },
    FARE_DIFFERENCE: {
      id: "FARE_DIFFERENCE",
      title: "Fare Difference Rule",
      text: "If a customer voluntarily chooses to rebook on a higher-fare flight (not airline-caused), they must pay the fare difference. Agents cannot waive fare differences above ₹1,500 without supervisor approval.",
      agentLimit: 1500,
    },
    LOYALTY_TIER: {
      id: "LOYALTY_TIER",
      title: "Loyalty Tier Rule",
      text: "Gold and Platinum tier customers get priority rebooking (first access to next-available seats) but no additional compensation beyond the standard policy.",
    },
  },

  // ── 4. ALLOWED vs PROHIBITED ACTIONS ──────────────────────
  allowed: [
    "Rebook on next available flight within 24h at no charge (airline-caused disruption)",
    "Issue meal vouchers and lounge access per delay compensation rule",
    "Arrange hotel accommodation for delayed-hours portion where delay qualifies (>5h)",
    "Initiate refund request for airline-caused cancellations",
    "Provide the customer's own booking and flight status information",
  ],
  prohibited: [
    "Approving compensation beyond stated policy amounts",
    "Waiving fare difference above ₹1,500 (requires supervisor approval)",
    "Making exceptions for non-airline-caused disruptions",
    "Handling threats of legal action or formal complaints (escalate immediately)",
    "Processing refunds to a different payment method than the original",
  ],

  // ── 5. SAMPLE CONVERSATION STYLE (tone reference) ─────────
  // These inform the agent's tone but are NOT policy/fact sources
  sampleTone: [
    { style: "empathetic-action", example: "I completely understand the frustration — I can see flight SK-190 was cancelled due to operational reasons. I can rebook you on the next available flight at no extra cost, or process a full refund. Which would you prefer?" },
    { style: "empathetic-limited", example: "I'm sorry for the disruption. Your flight was delayed 3 hours 40 minutes, which qualifies for a meal voucher and lounge access under our policy. I've applied both to your account now." },
    { style: "escalation", example: "I hear you, and I'm sorry this has been such a frustrating experience. I want to make sure this gets the right attention — I'm escalating this to our specialist support team right now, and they'll reach out to you directly." },
  ],

  // ── 6. SCENARIOS ──────────────────────────────────────────
  scenarios: {
    priya: {
      key: "priya",
      pnr: "SK4821X",
      label: "Scenario 1 — Priya Nair",
      tier: "Gold",
      seed: "Hi, this is Priya Nair. My booking reference is SK4821X.",
      highlight: "Cancelled flight. Wants refund + business class upgrade (prohibited).",
      quickActions: [
        { label: "I want a full refund", msg: "I want a full refund for my cancelled flight." },
        { label: "Rebook me on next flight", msg: "Can you rebook me on the next available flight to Goa?" },
        { label: "I want a business class upgrade", msg: "I'm furious! I want a business class upgrade on my return flight for all this trouble!" },
        { label: "Threaten legal action", msg: "This is absolutely outrageous. I'm going to file a formal complaint and consider taking legal action against SkyKing." },
      ],
    },
    arvind: {
      key: "arvind",
      pnr: "TR1190B",
      label: "Scenario 2 — Arvind Kulkarni",
      tier: "Silver",
      seed: "Hello, I'm Arvind Kulkarni. PNR is TR1190B.",
      highlight: "4-hour delay. Asks for hotel (NOT eligible — policy requires >5h).",
      quickActions: [
        { label: "What compensation do I get?", msg: "What compensation am I entitled to for this delay?" },
        { label: "I need hotel accommodation", msg: "I've missed my meeting. I need hotel accommodation since it's been such a long delay." },
        { label: "Can I get lounge access?", msg: "Can you give me lounge access while I wait?" },
        { label: "I'm very frustrated", msg: "This is ridiculous! I had a critical business meeting and now I've missed it entirely because of SkyKing's failure!" },
      ],
    },
    meher: {
      key: "meher",
      pnr: "WL7742",
      label: "Scenario 3 — Meher Kaur",
      tier: "Platinum",
      seed: "Good evening. This is Meher Kaur, PNR WL7742.",
      highlight: "6-hour delay. Wants full-night hotel (only delayed hours covered) + higher-fare rebook (₹2,000 → escalate).",
      quickActions: [
        { label: "Apply all my compensation", msg: "Please apply all the compensation I'm entitled to for this 6-hour delay." },
        { label: "I want a full night at a hotel", msg: "I want a full night's hotel stay, not just coverage for the delayed hours. It's a 6-hour delay!" },
        { label: "Move me to earlier flight (₹2000 diff)", msg: "I want to be moved to an earlier flight instead of waiting. The fare difference is ₹2,000." },
        { label: "Speak to a supervisor", msg: "I'd like to speak to a supervisor right now please." },
      ],
    },
  },
};

// ── LOOKUP HELPERS ─────────────────────────────────────────────
DATA.findByInput = function(input) {
  const str = input.trim().toUpperCase().replace(/\s+/g, "");
  // Direct PNR match
  if (DATA.customers[str]) return DATA.customers[str];
  // Partial PNR search (e.g. "SK4821X" within sentence)
  for (const pnr of Object.keys(DATA.customers)) {
    if (input.toUpperCase().includes(pnr)) return DATA.customers[pnr];
  }
  // Name match
  const lower = input.toLowerCase();
  for (const c of Object.values(DATA.customers)) {
    const nameLower = c.name.toLowerCase();
    const parts = nameLower.split(" ");
    if (lower.includes(nameLower) || parts.some(p => lower.includes(p) && p.length > 3)) {
      return c;
    }
  }
  return null;
};

DATA.getPrimaryBooking = function(pnr) {
  return (DATA.bookings[pnr] || []).find(b => b.isPrimary) || null;
};

DATA.getCompensation = function(booking) {
  if (!booking || booking.status === "UNAFFECTED") return null;
  if (booking.status === "CANCELLED") {
    return { type: "CANCELLED", policyId: "CANCELLATION_REBOOKING" };
  }
  const h = booking.delayHours;
  if (h > 5) return { type: "DELAY_5PLUS", policyId: "DELAY_COMPENSATION", tier: DATA.policies.DELAY_COMPENSATION.tiers.over5h, hours: h };
  if (h >= 3) return { type: "DELAY_3TO5", policyId: "DELAY_COMPENSATION", tier: DATA.policies.DELAY_COMPENSATION.tiers.over3h, hours: h };
  return { type: "DELAY_UNDER3", policyId: "DELAY_COMPENSATION", tier: DATA.policies.DELAY_COMPENSATION.tiers.under3h, hours: h };
};
