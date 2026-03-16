"use client";

import type { ParsedDeal } from "@/lib/hubspot";

interface DrawerHeroProps {
  deal: ParsedDeal;
}

function stagePillStyle(cat: string): { background: string; color: string } {
  switch (cat) {
    case "neg": return { background: "rgba(255,74,45,0.2)", color: "#FF4A2D" };
    case "prop": return { background: "rgba(79,163,209,0.2)", color: "#4FA3D1" };
    case "cw": return { background: "rgba(46,204,138,0.2)", color: "#2ECC8A" };
    default: return { background: "rgba(160,174,192,0.2)", color: "#A0AEC0" };
  }
}

function stageAgeColor(days: number): string {
  if (days <= 6) return "#2ECC8A";
  if (days <= 13) return "#F5A623";
  return "#FF4A2D";
}

function daysSinceLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function DrawerHero({ deal }: DrawerHeroProps) {
  const pillStyle = stagePillStyle(deal.cat);
  const ageColor = stageAgeColor(deal.stageAge);

  return (
    <div className="px-6 py-5" style={{ backgroundColor: "#194766" }}>
      {/* Row 1: Stage pill + stage age badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ background: pillStyle.background, color: pillStyle.color }}
        >
          {deal.stage}
        </span>
        {deal.stageAge > 0 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: `${ageColor}33`,
              color: ageColor,
            }}
          >
            {deal.stageAge}d in stage
          </span>
        )}
      </div>

      {/* Row 2: Deal name */}
      <h2 className="text-white font-bold leading-tight" style={{ fontSize: "18px" }}>
        {deal.name}
      </h2>

      {/* Row 3: Sub-line */}
      {deal.sub && (
        <p className="text-muted mt-0.5" style={{ fontSize: "11px" }}>
          {deal.sub}
        </p>
      )}

      {/* Row 4: Deal value */}
      <p className="font-bold mt-2" style={{ fontSize: "26px", color: "#FF4A2D" }}>
        {deal.valShort}
      </p>

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
          <span className="text-xs" style={{ color: "#4FA3D1" }}>{deal.persona}</span>
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
