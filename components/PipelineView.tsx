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

type TabKey = "all" | "neg" | "prop" | "ent" | "leads" | "cw";
type CwPeriod = "month" | "quarter" | "ytd";

function cwPeriodFilter(deal: ParsedDeal, period: CwPeriod): boolean {
  if (!deal.closeDate) return false;
  const close = new Date(deal.closeDate);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case "month":
      return close.getFullYear() === year && close.getMonth() === month;
    case "quarter": {
      const quarterStart = new Date(year, Math.floor(month / 3) * 3, 1);
      return close >= quarterStart && close.getFullYear() === year;
    }
    case "ytd":
      return close.getFullYear() === year;
  }
}

export default function PipelineView({ deals, repFilter, onDealClick, onResearchClick }: PipelineViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [cwPeriod, setCwPeriod] = useState<CwPeriod>("month");
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

  // All closed-won deals (rep-filtered)
  const cwDeals = useMemo(() => repDeals.filter((d) => d.cat === "cw"), [repDeals]);

  // Closed-won deals filtered by active period
  const cwFiltered = useMemo(
    () => cwDeals.filter((d) => cwPeriodFilter(d, cwPeriod)),
    [cwDeals, cwPeriod],
  );

  // Active deals only (exclude closed won/lost from main tabs)
  const activeRepDeals = useMemo(
    () => repDeals.filter((d) => d.cat !== "cw" && d.cat !== "cl"),
    [repDeals],
  );

  // Counts per category
  const counts = useMemo(() => {
    const c = { all: activeRepDeals.length, neg: 0, prop: 0, ent: 0, leads: 0 };
    for (const d of activeRepDeals) {
      if (d.cat === "neg") c.neg++;
      else if (d.cat === "prop") c.prop++;
      else if (d.cat === "ent") c.ent++;
      else if (d.cat === "leads") c.leads++;
    }
    return c;
  }, [activeRepDeals]);

  const tabs: Tab[] = [
    { key: "all", label: "Int Book", count: counts.all },
    { key: "neg", label: "Negotiation", count: counts.neg },
    { key: "prop", label: "Proposal", count: counts.prop },
    { key: "ent", label: "🐋", count: counts.ent },
    { key: "leads", label: "Prospects", count: counts.leads },
    { key: "cw", label: "🔔 Closed Won", count: cwFiltered.length },
  ];

  const filteredDeals = useMemo(() => {
    let result: ParsedDeal[];
    if (activeTab === "all") result = activeRepDeals;
    else if (activeTab === "cw") result = cwFiltered;
    else result = activeRepDeals.filter((d) => d.cat === activeTab);
    // Sort by amount descending (largest first)
    return [...result].sort((a, b) => b.val - a.val);
  }, [activeRepDeals, cwFiltered, activeTab]);

  const pillBase: React.CSSProperties = {
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600,
    border: "1px solid #2A3F5C",
    background: "transparent",
    color: "#6B7F96",
  };

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: "#FF4A2D",
    color: "#FFFFFF",
    border: "1px solid #FF4A2D",
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <TabBar
          tabs={tabs}
          active={activeTab}
          onSelect={(key) => setActiveTab(key as TabKey)}
        />
      </div>

      {/* Sub-filter pills for Closed Won */}
      {activeTab === "cw" && (
        <div className="flex items-center gap-2 mb-4">
          {(["month", "quarter", "ytd"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setCwPeriod(p)}
              style={cwPeriod === p ? pillActive : pillBase}
            >
              {p === "month" ? "Month" : p === "quarter" ? "Quarter" : "YTD"}
            </button>
          ))}
        </div>
      )}

      <DealGrid deals={filteredDeals} columns={4} onDealClick={onDealClick} onResearchClick={onResearchClick} />
    </div>
  );
}
