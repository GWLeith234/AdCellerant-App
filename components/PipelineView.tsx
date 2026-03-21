"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { ParsedDeal } from "@/lib/hubspot";
import TabBar, { type Tab } from "./TabBar";
import DealGrid from "./DealGrid";

interface PipelineViewProps {
  deals: ParsedDeal[];
  repFilter?: string;
  onDealClick?: (deal: ParsedDeal) => void;
  onResearchClick?: (deal: ParsedDeal) => void;
}

type TabKey = "all" | "neg" | "prop" | "ent" | "leads";

export default function PipelineView({ deals, repFilter, onDealClick, onResearchClick }: PipelineViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const prevFilterRef = useRef(repFilter);

  // Reset to "all" when repFilter changes
  useEffect(() => {
    if (prevFilterRef.current !== repFilter) {
      prevFilterRef.current = repFilter;
      setActiveTab("all");
    }
  }, [repFilter]);

  // Filter by rep if provided
  const repDeals = useMemo(() => {
    if (!repFilter) return deals;
    return deals.filter((d) => d.rep === repFilter);
  }, [deals, repFilter]);

  // Counts per category
  const counts = useMemo(() => {
    const c = { all: repDeals.length, neg: 0, prop: 0, ent: 0, leads: 0 };
    for (const d of repDeals) {
      if (d.cat === "neg") c.neg++;
      else if (d.cat === "prop") c.prop++;
      else if (d.cat === "ent") c.ent++;
      else if (d.cat === "leads") c.leads++;
    }
    return c;
  }, [repDeals]);

  const tabs: Tab[] = [
    { key: "all", label: "Int Book", count: counts.all },
    { key: "neg", label: "Negotiation", count: counts.neg },
    { key: "prop", label: "Proposal", count: counts.prop },
    { key: "ent", label: "🐋", count: counts.ent },
    { key: "leads", label: "Prospects", count: counts.leads },
  ];

  const filteredDeals = useMemo(() => {
    if (activeTab === "all") return repDeals;
    return repDeals.filter((d) => d.cat === activeTab);
  }, [repDeals, activeTab]);

  return (
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
  );
}
