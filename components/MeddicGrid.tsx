"use client";

import type { MeddicScore } from "@/lib/hubspot";

interface MeddicGridProps {
  meddic: MeddicScore;
}

const MEDDIC_LABELS: Record<keyof MeddicScore, string> = {
  metrics: "Metrics",
  econBuyer: "Economic Buyer",
  decisionCriteria: "Decision Criteria",
  decisionProcess: "Decision Process",
  identifyPain: "Identify Pain",
  champion: "Champion",
};

function statusText(val: string): string {
  if (!val) return "Not assessed";
  const v = val.toLowerCase();
  if (v === "ok" || v === "yes" || v === "done" || v === "complete") return "✅ Confirmed";
  if (v === "partial" || v === "wip" || v === "started" || v === "in progress") return "⚠️ Partial";
  if (v === "gap" || v === "no" || v === "missing") return "❌ Gap";
  return val;
}

function borderColor(val: string): string {
  if (!val) return "#555";
  const v = val.toLowerCase();
  if (v === "ok" || v === "yes" || v === "done" || v === "complete") return "#2ECC8A";
  if (v === "partial" || v === "wip" || v === "started" || v === "in progress") return "#F5A623";
  return "#FF4A2D";
}

export default function MeddicGrid({ meddic }: MeddicGridProps) {
  const entries = Object.entries(meddic) as [keyof MeddicScore, string][];

  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="bg-navy/50 rounded-lg px-3 py-2.5 border-l-[3px]"
          style={{ borderLeftColor: borderColor(val) }}
        >
          <p className="text-muted text-[10px] uppercase tracking-wider">
            {MEDDIC_LABELS[key]}
          </p>
          <p className="text-white text-xs mt-0.5">{statusText(val)}</p>
        </div>
      ))}
    </div>
  );
}
