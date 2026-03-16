"use client";

import { useState, useMemo, useEffect } from "react";
import type { ParsedDeal } from "@/lib/hubspot";
import TabBar, { type Tab } from "./TabBar";
import DealGrid from "./DealGrid";

interface FocusedPipelineProps {
  deals: ParsedDeal[];
  rep: string;
  onDealClick?: (deal: ParsedDeal) => void;
  onResearchClick?: (deal: ParsedDeal) => void;
}

type FocusedTab = "urgent" | "neg" | "prop" | "ent" | "leads" | "highval" | "cw";

function daysUntilClose(closeDate: string): number {
  if (!closeDate) return Infinity;
  const close = new Date(closeDate).getTime();
  return Math.ceil((close - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function FocusedPipeline({ deals, rep, onDealClick, onResearchClick }: FocusedPipelineProps) {
  const repDeals = useMemo(() => deals.filter((d) => d.rep === rep), [deals, rep]);

  const counts = useMemo(() => {
    const c = { urgent: 0, neg: 0, prop: 0, ent: 0, leads: 0, highval: 0, cw: 0 };
    for (const d of repDeals) {
      if (daysUntilClose(d.closeDate) <= 2 && d.cat !== "cw") c.urgent++;
      if (d.cat === "neg") c.neg++;
      else if (d.cat === "prop") c.prop++;
      else if (d.cat === "ent") c.ent++;
      else if (d.cat === "leads") c.leads++;
      else if (d.cat === "cw") c.cw++;
      if (d.val >= 250_000) c.highval++;
    }
    return c;
  }, [repDeals]);

  const [activeTab, setActiveTab] = useState<FocusedTab>("neg");

  // Auto-open urgent if urgent deals exist
  useEffect(() => {
    if (counts.urgent > 0) {
      setActiveTab("urgent");
    }
  }, [counts.urgent]);

  const tabs: Tab[] = [
    { key: "urgent", label: "Urgent", count: counts.urgent },
    { key: "neg", label: "Negotiation", count: counts.neg },
    { key: "prop", label: "Proposal", count: counts.prop },
    { key: "ent", label: "High Value", count: counts.ent },
    { key: "leads", label: "Leads", count: counts.leads },
    { key: "highval", label: "Whale (≥$250K)", count: counts.highval },
    { key: "cw", label: "Closed Won", count: counts.cw },
  ];

  const filteredDeals = useMemo(() => {
    switch (activeTab) {
      case "urgent":
        return repDeals.filter((d) => daysUntilClose(d.closeDate) <= 2 && d.cat !== "cw");
      case "neg":
        return repDeals.filter((d) => d.cat === "neg");
      case "prop":
        return repDeals.filter((d) => d.cat === "prop");
      case "ent":
        return repDeals.filter((d) => d.cat === "ent");
      case "leads":
        return repDeals.filter((d) => d.cat === "leads");
      case "highval":
        return repDeals.filter((d) => d.val >= 250_000);
      case "cw":
        return repDeals.filter((d) => d.cat === "cw");
      default:
        return repDeals;
    }
  }, [repDeals, activeTab]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <TabBar
          tabs={tabs}
          active={activeTab}
          onSelect={(key) => setActiveTab(key as FocusedTab)}
        />
      </div>
      <DealGrid deals={filteredDeals} columns={3} onDealClick={onDealClick} onResearchClick={onResearchClick} />
    </div>
  );
}
