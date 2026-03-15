"use client";

import type { ParsedDeal } from "@/lib/hubspot";

interface DrawerHeroProps {
  deal: ParsedDeal;
}

function stagePillColor(cat: string): string {
  switch (cat) {
    case "neg": return "bg-orange/20 text-orange";
    case "prop": return "bg-blue/20 text-blue";
    case "leads": return "bg-muted/20 text-muted";
    case "cw": return "bg-green/20 text-green";
    default: return "bg-muted/20 text-muted";
  }
}

function stageAgeBadge(days: number): { cls: string } {
  if (days <= 6) return { cls: "bg-green/20 text-green" };
  if (days <= 13) return { cls: "bg-amber/20 text-amber" };
  return { cls: "bg-orange/20 text-orange" };
}

function daysSinceLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function DrawerHero({ deal }: DrawerHeroProps) {
  const age = stageAgeBadge(deal.stageAge);

  return (
    <div className="bg-slate px-6 py-5">
      {/* Stage pill + stage age badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${stagePillColor(deal.cat)}`}>
          {deal.stage}
        </span>
        {deal.stageAge > 0 && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${age.cls}`}>
            {deal.stageAge}d in stage
          </span>
        )}
      </div>

      {/* Deal name */}
      <h2 className="text-white text-lg font-bold leading-tight">{deal.name}</h2>
      {deal.sub && (
        <p className="text-muted text-sm mt-0.5">{deal.sub}</p>
      )}

      {/* Value */}
      <p className="text-orange text-xl font-bold mt-2">{deal.valShort}</p>

      {/* Meta strip */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {deal.closeDate && (
          <span className="text-muted text-xs">
            Close:{" "}
            {new Date(deal.closeDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
        {deal.persona && (
          <span className="text-blue text-xs">{deal.persona}</span>
        )}
        {deal.stageAge > 0 && (
          <span className="text-muted text-xs">
            Last activity: {daysSinceLabel(deal.stageAge)}
          </span>
        )}
      </div>
    </div>
  );
}
