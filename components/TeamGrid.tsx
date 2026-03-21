"use client";

import { useState, useMemo } from "react";
import type { ParsedDeal } from "@/lib/hubspot";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";
import { REP_CONFIGS } from "@/lib/reps";
import RepCard from "./RepCard";
import TabBar, { type Tab } from "./TabBar";
import DealGrid from "./DealGrid";

interface TeamGridProps {
  deals: ParsedDeal[];
  booked: BookedByRepMonth;
  targets: TargetsByRepMonth;
  onDealClick?: (deal: ParsedDeal) => void;
  onResearchClick?: (deal: ParsedDeal) => void;
}

type TabKey = "all" | "neg" | "prop" | "ent" | "leads";

export default function TeamGrid({ deals, booked, targets, onDealClick, onResearchClick }: TeamGridProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedRep, setSelectedRep] = useState<string | null>(null);

  // Current month label (short name)
  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });

  // Filter deals by selected rep
  const repFilteredDeals = useMemo(() => {
    if (!selectedRep) return deals;
    return deals.filter((d) => d.rep === selectedRep);
  }, [deals, selectedRep]);

  // Counts per category (based on rep-filtered deals)
  const counts = useMemo(() => {
    const c = { all: repFilteredDeals.length, neg: 0, prop: 0, ent: 0, leads: 0 };
    for (const d of repFilteredDeals) {
      if (d.cat === "neg") c.neg++;
      else if (d.cat === "prop") c.prop++;
      else if (d.cat === "ent") c.ent++;
      else if (d.cat === "leads") c.leads++;
    }
    return c;
  }, [repFilteredDeals]);

  const tabs: Tab[] = [
    { key: "all", label: "All Deals", count: counts.all },
    { key: "neg", label: "Negotiation", count: counts.neg },
    { key: "prop", label: "Proposal", count: counts.prop },
    { key: "ent", label: "High Value", count: counts.ent },
    { key: "leads", label: "Leads", count: counts.leads },
  ];

  const filteredDeals = useMemo(() => {
    if (activeTab === "all") return repFilteredDeals;
    return repFilteredDeals.filter((d) => d.cat === activeTab);
  }, [repFilteredDeals, activeTab]);

  const selectedRepConfig = selectedRep
    ? REP_CONFIGS.find((r) => r.key === selectedRep)
    : null;

  const handleRepSelect = (key: string) => {
    setSelectedRep((prev) => (prev === key ? null : key));
    setActiveTab("all");
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

      {/* Deal tabs + grid */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <TabBar
            tabs={tabs}
            active={activeTab}
            onSelect={(key) => setActiveTab(key as TabKey)}
          />
        </div>
        <DealGrid deals={filteredDeals} columns={4} onDealClick={onDealClick} onResearchClick={onResearchClick} />
      </div>
    </div>
  );
}
