import type { ParsedDeal } from "./hubspot";
import mockData from "./mockDeals.json";

// Map JSON MEDDIC keys → ParsedDeal MeddicScore keys
function mapMeddic(m: Record<string, string>) {
  return {
    metrics: m.Metrics || "",
    econBuyer: m.EconBuyer || "",
    decisionCriteria: m.Criteria || "",
    decisionProcess: m.Process || "",
    identifyPain: m.Pain || "",
    champion: m.Champion || "",
  };
}

// Map stageKey → stageClass
const STAGE_CLASS: Record<string, string> = {
  appointmentscheduled: "stage-lead",
  qualifiedtobuy: "stage-lead",
  presentationscheduled: "stage-prop",
  decisionmakerboughtin: "stage-neg",
  closedwon: "stage-cw",
  closedlost: "stage-cl",
};

// Parse human-readable close string → ISO date (best effort)
function parseCloseDate(close: string): string {
  if (!close) return "";
  // Extract "Mar 16", "Apr 1", etc. from strings like "Mar 16 — overdue", "TODAY — overdue"
  if (close.toUpperCase().startsWith("TODAY")) return "2026-03-16";
  const match = close.match(/^([A-Z][a-z]{2})\s+(\d{1,2})/);
  if (!match) return "";
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const mo = months[match[1]] || "01";
  const day = match[2].padStart(2, "0");
  return `2026-${mo}-${day}`;
}

function fmtVal(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

interface RawDeal {
  id: string;
  hsId: string;
  name: string;
  sub: string;
  val: string;
  valShort: string;
  rep: string;
  stage: string;
  stageKey: string;
  close: string;
  closeClass: string;
  cat: string;
  urgent: boolean;
  stageAge: number;
  amount: number;
  meddic: Record<string, string>;
  contacts: { n: string; r: string; i: string }[];
  nda: string;
  msa: string;
  sow: string;
  credit: string;
  bizdev: string;
  partner: string;
  action1: string;
  action2: string;
  persona: string;
  vend: boolean;
  activity: string;
  hasResearch: boolean;
  domain: string | null;
}

export const MOCK_DEALS: ParsedDeal[] = (mockData.deals as RawDeal[]).map((d) => ({
  id: d.id,
  hsId: d.hsId,
  name: d.name,
  sub: d.sub,
  val: d.amount,
  valShort: fmtVal(d.amount),
  rep: d.rep,
  stage: d.stage,
  stageClass: STAGE_CLASS[d.stageKey] || "stage-unknown",
  cat: d.cat,
  closeDate: parseCloseDate(d.close),
  stageAge: d.stageAge,
  persona: d.persona,
  revenueLine: "",
  meddic: mapMeddic(d.meddic),
  contacts: d.contacts.map((c) => ({ name: c.n, role: c.r, initials: c.i })),
  nda: d.nda,
  msa: d.msa,
  sow: d.sow,
  credit: d.credit,
  bizdev: d.bizdev,
  partner: d.partner,
  hasResearch: d.hasResearch,
  researchNotes: "",
  action1: d.action1,
  action2: d.action2,
  description: "",
  domain: d.domain || null,
}));

// Quick lookup by HubSpot ID
export const dealMap = new Map(MOCK_DEALS.map((d) => [d.hsId, d]));
