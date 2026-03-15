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
}

type TabKey = "all" | "neg" | "prop" | "leads";

export default function TeamGrid({ deals, booked, targets }: TeamGridProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // Current month label (short name)
  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });

  // Counts per category
  const counts = useMemo(() => {
    const c = { all: deals.length, neg: 0, prop: 0, leads: 0 };
    for (const d of deals) {
      if (d.cat === "neg") c.neg++;
      else if (d.cat === "prop") c.prop++;
      else if (d.cat === "leads") c.leads++;
    }
    return c;
  }, [deals]);

  const tabs: Tab[] = [
    { key: "all", label: "All Deals", count: counts.all },
    { key: "neg", label: "Negotiation", count: counts.neg },
    { key: "prop", label: "Proposal", count: counts.prop },
    { key: "leads", label: "Leads", count: counts.leads },
  ];

  const filteredDeals = useMemo(() => {
    if (activeTab === "all") return deals;
    return deals.filter((d) => d.cat === activeTab);
  }, [deals, activeTab]);

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
            />
          );
        })}
      </div>

      {/* Deal tabs + grid */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <TabBar
            tabs={tabs}
            active={activeTab}
            onSelect={(key) => setActiveTab(key as TabKey)}
          />
        </div>
        <DealGrid deals={filteredDeals} columns={4} />
      </div>
    </div>
  );
}
