"use client";

import type { ParsedDeal, MeddicScore } from "@/lib/hubspot";

interface DealCardProps {
  deal: ParsedDeal;
  onClick?: () => void;
  onAIClick?: (deal: ParsedDeal) => void;
  onResearchClick?: (deal: ParsedDeal) => void;
}

// --- Close date helpers ---

function daysUntilClose(closeDate: string): number {
  if (!closeDate) return Infinity;
  const close = new Date(closeDate).getTime();
  const now = Date.now();
  return Math.ceil((close - now) / (1000 * 60 * 60 * 24));
}

function closeDateColor(closeDate: string): string {
  const days = daysUntilClose(closeDate);
  if (days <= 1) return "text-orange";
  if (days <= 7) return "text-amber";
  if (days === Infinity) return "text-muted";
  return "text-muted";
}

function closeDateColorClosed(cat: string, closeDate: string): string {
  if (cat === "cw") return "text-green";
  return closeDateColor(closeDate);
}

// --- Stage age badge ---

function stageAgeBadge(days: number): { text: string; cls: string } {
  if (days <= 6) return { text: `${days}d`, cls: "bg-green/20 text-green" };
  if (days <= 13) return { text: `${days}d`, cls: "bg-amber/20 text-amber" };
  return { text: `${days}d`, cls: "bg-orange/20 text-orange" };
}

// --- MEDDIC ---

function meddicDotColor(val: string): string {
  const v = val.toLowerCase();
  if (v === "ok" || v === "yes" || v === "done" || v === "complete") return "bg-green";
  if (v === "partial" || v === "wip" || v === "started" || v === "in progress") return "bg-amber";
  if (v && v !== "" && v !== "gap" && v !== "no" && v !== "missing") return "bg-amber";
  return "bg-orange";
}

function meddicDotTitle(key: string, val: string): string {
  const labels: Record<string, string> = {
    metrics: "Metrics",
    econBuyer: "Econ Buyer",
    decisionCriteria: "Decision Criteria",
    decisionProcess: "Decision Process",
    identifyPain: "Identify Pain",
    champion: "Champion",
  };
  return `${labels[key] || key}: ${val || "gap"}`;
}

function meddicPercentage(meddic: MeddicScore): number {
  const fields = Object.values(meddic);
  if (fields.every((v) => !v)) return 0;
  const ok = fields.filter((v) => {
    const lv = v.toLowerCase();
    return lv === "ok" || lv === "yes" || lv === "done" || lv === "complete";
  }).length;
  return Math.round((ok / 6) * 100);
}

// --- Left border ---

function leftBorderColor(deal: ParsedDeal): string {
  const daysToClose = daysUntilClose(deal.closeDate);
  if (daysToClose <= 2 && deal.cat !== "cw") return "border-l-orange";
  if (deal.val >= 250_000) return "border-l-amber";
  if (deal.stageAge >= 14) return "border-l-muted";
  return "border-l-transparent";
}

export default function DealCard({ deal, onClick, onAIClick, onResearchClick }: DealCardProps) {
  const daysToClose = daysUntilClose(deal.closeDate);
  const isUrgent = daysToClose <= 2 && deal.cat !== "cw";
  const isWhale = deal.val >= 250_000;
  const isVendasta = deal.rep === "vendasta";
  const age = stageAgeBadge(deal.stageAge);
  const meddicPct = meddicPercentage(deal.meddic);
  const meddicFields = Object.entries(deal.meddic) as [keyof MeddicScore, string][];

  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-lg cursor-pointer
        transition-all duration-150 hover:-translate-y-0.5 hover:border-blue/50 hover:shadow-[0_0_12px_rgba(79,163,209,0.15)]
        flex flex-col border-l-[3px] ${leftBorderColor(deal)}`}
    >
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        {/* Row 1: Name + Value */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-white font-semibold text-sm leading-tight truncate flex-1">
            {deal.name}
          </p>
          <p className="text-orange font-bold text-sm whitespace-nowrap">
            {deal.valShort}
          </p>
        </div>

        {/* Row 2: Sub-line */}
        {deal.sub && (
          <p className="text-muted text-[11px] truncate -mt-1">{deal.sub}</p>
        )}

        {/* Row 3: Close date + stage age badge */}
        <div className="flex items-center gap-2">
          {deal.closeDate && (
            <span className={`text-[11px] ${closeDateColorClosed(deal.cat, deal.closeDate)}`}>
              {new Date(deal.closeDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          {deal.stageAge > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${age.cls}`}>
              {age.text}
            </span>
          )}
        </div>

        {/* Row 4: Persona + Rep */}
        <div className="flex items-center gap-2">
          {deal.persona && (
            <span className="text-blue text-[11px] truncate">{deal.persona}</span>
          )}
          <span className="text-muted text-[11px] capitalize ml-auto whitespace-nowrap">
            {deal.rep}
          </span>
        </div>

        {/* Row 5: MEDDIC dots + percentage */}
        <div className="flex items-center gap-1">
          {meddicFields.map(([key, val]) => (
            <span
              key={key}
              title={meddicDotTitle(key, val)}
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                val ? meddicDotColor(val) : "bg-border"
              }`}
            />
          ))}
          <span
            className={`text-[10px] font-medium ml-auto whitespace-nowrap ${
              meddicPct >= 100
                ? "text-green"
                : meddicPct >= 50
                ? "text-amber"
                : meddicPct > 0
                ? "text-orange"
                : "text-muted"
            }`}
          >
            {meddicPct > 0 ? `${meddicPct}%` : ""}
          </span>
        </div>

        {/* Row 6: Pills */}
        {(isUrgent || isWhale || isVendasta) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {isUrgent && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange/20 text-orange font-medium whitespace-nowrap">
                Urgent
              </span>
            )}
            {isWhale && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/20 text-amber font-medium whitespace-nowrap">
                Whale
              </span>
            )}
            {isVendasta && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green/20 text-green font-medium whitespace-nowrap">
                Vendasta
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom row: drill text + AI/research button */}
      <div className="border-t border-border px-3.5 py-2 flex items-center justify-between gap-2">
        <p className="text-muted text-[10px] truncate flex-1">
          {deal.action1}
        </p>
        {deal.hasResearch ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAIClick?.(deal);
            }}
            className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 transition-colors"
            title="AI Research Available"
          >
            <span className="text-[#7C3AED] text-sm leading-none">&#10022;</span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResearchClick?.(deal);
            }}
            className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber/20 text-amber hover:bg-amber/30 transition-colors whitespace-nowrap"
            title="Research needed"
          >
            Research
          </button>
        )}
      </div>
    </div>
  );
}
