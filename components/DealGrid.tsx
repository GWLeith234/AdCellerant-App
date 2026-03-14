"use client";

import type { ParsedDeal } from "@/lib/hubspot";
import DealCard from "./DealCard";

interface DealGridProps {
  deals: ParsedDeal[];
}

export default function DealGrid({ deals }: DealGridProps) {
  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted text-sm">No deals in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}
