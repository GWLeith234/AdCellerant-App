"use client";

import type { ParsedDeal } from "@/lib/hubspot";

interface DealCardProps {
  deal: ParsedDeal;
  onClick?: () => void;
}

function stageColor(cat: string): string {
  switch (cat) {
    case "leads":
      return "bg-blue/20 text-blue";
    case "prop":
      return "bg-amber/20 text-amber";
    case "neg":
      return "bg-orange/20 text-orange";
    case "cw":
      return "bg-green/20 text-green";
    default:
      return "bg-muted/20 text-muted";
  }
}

export default function DealCard({ deal, onClick }: DealCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-blue/50 transition-colors flex flex-col justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-white font-medium text-sm truncate flex-1">
            {deal.name}
          </p>
          <p className="text-orange font-bold text-sm whitespace-nowrap">
            {deal.valShort}
          </p>
        </div>
        {deal.sub && (
          <p className="text-muted text-xs truncate mt-0.5">{deal.sub}</p>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${stageColor(deal.cat)}`}
        >
          {deal.stage}
        </span>
        <span className="text-muted text-[10px] capitalize">{deal.rep}</span>
        {deal.stageAge > 0 && (
          <span
            className={`text-[10px] ml-auto ${
              deal.stageAge > 14 ? "text-orange" : "text-muted"
            }`}
          >
            {deal.stageAge}d
          </span>
        )}
      </div>

      {deal.closeDate && (
        <p className="text-muted text-[10px] mt-1">
          Close:{" "}
          {new Date(deal.closeDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </p>
      )}
    </div>
  );
}
