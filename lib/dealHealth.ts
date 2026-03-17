import type { ParsedDeal } from "./hubspot";

export function dealHealthScore(deal: ParsedDeal): {
  score: number;
  missing: string[];
  status: "green" | "amber" | "red";
} {
  const checks = [
    { label: "Metrics confirmed", pass: deal.meddic.metrics === "ok" },
    { label: "Economic buyer engaged", pass: deal.meddic.econBuyer === "ok" },
    { label: "Decision criteria known", pass: deal.meddic.decisionCriteria === "ok" },
    { label: "Decision process mapped", pass: deal.meddic.decisionProcess === "ok" },
    { label: "Pain points identified", pass: deal.meddic.identifyPain === "ok" },
    { label: "Champion confirmed", pass: deal.meddic.champion === "ok" },
    { label: "Research on file", pass: deal.hasResearch === true },
    { label: "Contacts added", pass: deal.contacts.length > 0 },
    { label: "NDA sent or signed", pass: deal.nda !== "Not sent" },
    { label: "Close date set", pass: !!deal.closeDate },
  ];
  const points = [10, 10, 10, 10, 10, 10, 15, 10, 10, 5];
  let score = 0;
  const missing: string[] = [];
  checks.forEach((c, i) => {
    if (c.pass) score += points[i];
    else missing.push(c.label);
  });
  const status = score >= 80 ? "green" : score >= 50 ? "amber" : "red";
  return { score, missing, status };
}

export function dealWarmth(deal: ParsedDeal): {
  daysStale: number;
  status: "warm" | "cooling" | "cold";
  nudgeRequired: boolean;
  urgency: "low" | "medium" | "high";
} {
  const days = deal.stageAge;

  // Stage-aware thresholds — Negotiation goes cold faster
  const thresholds = {
    neg: { cooling: 3, cold: 7 },
    prop: { cooling: 5, cold: 10 },
    leads: { cooling: 7, cold: 14 },
  };

  const t =
    deal.cat === "neg"
      ? thresholds.neg
      : deal.cat === "prop"
        ? thresholds.prop
        : thresholds.leads;

  const status: "warm" | "cooling" | "cold" =
    days < t.cooling ? "warm" : days < t.cold ? "cooling" : "cold";

  const urgency: "low" | "medium" | "high" =
    status === "cold" ? "high" : status === "cooling" ? "medium" : "low";

  return {
    daysStale: days,
    status,
    nudgeRequired: status !== "warm",
    urgency,
  };
}
