import masterData from "./masterData.json";
import type { ParsedDeal, MeddicScore, MeddicNotes, ContactInfo } from "./hubspot";
import type { BookedByRepMonth, TargetsByRepMonth } from "./types";

// ── Types derived from master data ──────────────────────────

export type MasterRep = (typeof masterData.reps)["george"];
export type MasterDeal = (typeof masterData.deals.active)[0];

// ── Default MEDDIC (all gap) ────────────────────────────────

const DEFAULT_MEDDIC: MeddicScore = {
  metrics: "gap",
  econBuyer: "gap",
  decisionCriteria: "gap",
  decisionProcess: "gap",
  identifyPain: "gap",
  champion: "gap",
};

const DEFAULT_MEDDIC_NOTES: MeddicNotes = {
  metrics: "",
  econBuyer: "",
  decisionCriteria: "",
  decisionProcess: "",
  identifyPain: "",
  champion: "",
};

// ── Value formatting ────────────────────────────────────────

function formatValShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

// ── Convert a master-data deal to ParsedDeal ────────────────

function toParsedDeal(d: MasterDeal): ParsedDeal {
  return {
    id: d.id,
    hsId: d.id,
    name: d.name,
    sub: d.company,
    val: d.amount,
    valShort: formatValShort(d.amount),
    rep: d.rep,
    stage: d.stage,
    stageClass: d.stageClass,
    cat: d.cat,
    closeDate: d.close_date,
    stageAge: d.stage_age,
    persona: d.persona,
    revenueLine: d.revenue_line,
    meddic: { ...DEFAULT_MEDDIC },
    contacts: (d.contacts || []) as ContactInfo[],
    nda: "none",
    msa: "none",
    sow: "none",
    credit: "none",
    bizdev: "none",
    partner: "none",
    hasResearch: false,
    researchNotes: "",
    meddicNotes: { ...DEFAULT_MEDDIC_NOTES },
    action1: "Follow Up",
    action2: "Update Stage",
    description: "",
    domain: null,
  };
}

// ── Public API ──────────────────────────────────────────────

/** All active deals as ParsedDeal[] */
export function getActiveDeals(): ParsedDeal[] {
  return masterData.deals.active.map(toParsedDeal);
}

/** All closed-won deals as ParsedDeal[] */
export function getClosedWonDeals(): ParsedDeal[] {
  return masterData.deals.closed_won.map(toParsedDeal);
}

/** All closed-lost deals as ParsedDeal[] */
export function getClosedLostDeals(): ParsedDeal[] {
  return masterData.deals.closed_lost.map(toParsedDeal);
}

/** All deals (active + closed won + closed lost) */
export function getAllDeals(): ParsedDeal[] {
  return [...getActiveDeals(), ...getClosedWonDeals(), ...getClosedLostDeals()];
}

/** Get a rep's data from master data */
export function getRep(id: string): MasterRep | null {
  return (masterData.reps as unknown as Record<string, MasterRep>)[id] || null;
}

/** Get all reps */
export function getReps() {
  return masterData.reps;
}

/** Active deals filtered by rep key */
export function getDealsByRep(repKey: string): ParsedDeal[] {
  return getActiveDeals().filter((d) => d.rep === repKey);
}

/** Active deals filtered by owner name */
export function getDealsByOwner(ownerName: string): ParsedDeal[] {
  const nameToKey: Record<string, string> = {
    "George Leith": "george",
    "Andy McNab": "andy",
    "Alex Kirkley": "alex",
  };
  const key = nameToKey[ownerName];
  if (!key) return [];
  return getDealsByRep(key);
}

/** Summary stats */
export function getSummary() {
  return masterData.summary;
}

/** Data generation timestamp */
export function getGeneratedAt(): string {
  return masterData.generated_at;
}

// ── Booked / Targets for RevenueDataContext seeding ─────────

/** Extract booked revenue by rep×month from master data */
export function getMasterBooked(): BookedByRepMonth {
  const result: BookedByRepMonth = {};
  for (const [key, rep] of Object.entries(masterData.reps)) {
    const monthly: Record<string, number> = {};
    for (const [month, val] of Object.entries(rep.revenue.monthly)) {
      if (val > 0) monthly[month] = val;
    }
    if (Object.keys(monthly).length > 0) result[key] = monthly;
  }
  return result;
}

/** Extract targets by rep×month from master data */
export function getMasterTargets(): TargetsByRepMonth {
  const result: TargetsByRepMonth = {};
  for (const [key, rep] of Object.entries(masterData.reps)) {
    const monthly: Record<string, number> = {};
    for (const [month, val] of Object.entries(rep.targets.monthly)) {
      if (val > 0) monthly[month] = val;
    }
    if (Object.keys(monthly).length > 0) result[key] = monthly;
  }
  return result;
}
