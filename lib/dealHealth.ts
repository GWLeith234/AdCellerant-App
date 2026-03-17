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
