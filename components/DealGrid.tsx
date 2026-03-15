"use client";

import type { ParsedDeal } from "@/lib/hubspot";
import DealCard from "./DealCard";

interface DealGridProps {
  deals: ParsedDeal[];
  columns?: 3 | 4;
  onDealClick?: (deal: ParsedDeal) => void;
  onAIClick?: (deal: ParsedDeal) => void;
  onResearchClick?: (deal: ParsedDeal) => void;
}

export default function DealGrid({
  deals,
  columns = 4,
  onDealClick,
  onAIClick,
  onResearchClick,
}: DealGridProps) {
  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted text-sm">No deals in this category</p>
      </div>
    );
  }

  const gridCls =
    columns === 3
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3";

  return (
    <div className={gridCls}>
      {deals.map((deal) => (
        <DealCard
          key={deal.id}
          deal={deal}
          onClick={() => onDealClick?.(deal)}
          onAIClick={onAIClick}
          onResearchClick={onResearchClick}
        />
      ))}
    </div>
  );
}
