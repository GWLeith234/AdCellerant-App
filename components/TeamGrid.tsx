"use client";

import { useState } from "react";
import type { ParsedDeal } from "@/lib/hubspot";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";
import { REP_CONFIGS } from "@/lib/reps";
import RepCard from "./RepCard";
import PipelineView from "./PipelineView";

interface TeamGridProps {
  deals: ParsedDeal[];
  booked: BookedByRepMonth;
  targets: TargetsByRepMonth;
  onDealClick?: (deal: ParsedDeal) => void;
  onResearchClick?: (deal: ParsedDeal) => void;
}

export default function TeamGrid({ deals, booked, targets, onDealClick, onResearchClick }: TeamGridProps) {
  const [selectedRep, setSelectedRep] = useState<string | null>(null);

  // Current month label (short name)
  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });

  const selectedRepConfig = selectedRep
    ? REP_CONFIGS.find((r) => r.key === selectedRep)
    : null;

  const handleRepSelect = (key: string) => {
    setSelectedRep((prev) => (prev === key ? null : key));
  };

  return (
    <div>
      {/* Rep cards — 4 column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REP_CONFIGS.map((config) => {
          const repDeals = deals.filter((d) => d.rep === config.key);
          const pipelineVal = repDeals.reduce((sum, d) => sum + d.val, 0);
          return (
            <RepCard
              key={config.key}
              config={config}
              dealCount={repDeals.length}
              pipelineVal={pipelineVal}
              booked={booked}
              targets={targets}
              currentMonth={currentMonth}
              selected={selectedRep === config.key}
              dimmed={!!selectedRep && selectedRep !== config.key}
              onSelect={() => handleRepSelect(config.key)}
            />
          );
        })}
      </div>

      {/* Filter badge */}
      {selectedRepConfig && (
        <div className="mt-4 flex items-center gap-2">
          <span style={{ fontSize: 12, color: "#6B7F96" }}>Showing:</span>
          <span
            style={{
              background: "#4FA3D1",
              color: "#FFFFFF",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {selectedRepConfig.name}
          </span>
          <span
            onClick={() => setSelectedRep(null)}
            style={{ fontSize: 11, color: "#4FA3D1", cursor: "pointer" }}
          >
            ✕ clear
          </span>
        </div>
      )}

      {/* Pipeline tabs + deal grid */}
      <PipelineView
        deals={deals}
        repFilter={selectedRep || undefined}
        onDealClick={onDealClick}
        onResearchClick={onResearchClick}
      />
    </div>
  );
}
