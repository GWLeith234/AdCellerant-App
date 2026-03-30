"use client";

import { useState, useMemo } from "react";
import { redirect } from "next/navigation";
import type { ParsedDeal } from "@/lib/hubspot";
import { useRevenueData } from "@/lib/RevenueDataContext";
import { useDealData } from "@/lib/DealDataContext";
import { getAllDeals, getMasterBooked, getMasterTargets, getRep } from "@/lib/dataProvider";
import { getRepConfig } from "@/lib/reps";
import RepHeader from "@/components/RepHeader";
import ScorecardPanel from "@/components/ScorecardPanel";
import FocusedPipeline from "@/components/FocusedPipeline";
import DealDrawer from "@/components/DealDrawer";
import ResearchRequestModal from "@/components/ResearchRequestModal";

const MASTER_DEALS = getAllDeals();
const MASTER_BOOKED = getMasterBooked();
const MASTER_TARGETS = getMasterTargets();

const VALID_REPS = ["george", "andy", "alex", "vendasta"];

interface RepDashboardClientProps {
  repKey: string;
}

export default function RepDashboardClient({ repKey }: RepDashboardClientProps) {
  const { bookedByRepMonth, targetsByRepMonth, hasRevenueData } = useRevenueData();
  const { uploadedDeals, hasUploadedDeals } = useDealData();

  const [selectedDeal, setSelectedDeal] = useState<ParsedDeal | null>(null);
  const [researchDeal, setResearchDeal] = useState<ParsedDeal | null>(null);

  if (!VALID_REPS.includes(repKey)) {
    redirect("/dashboard");
  }

  const config = getRepConfig(repKey);
  const masterRep = getRep(repKey);

  const allDeals = useMemo(() => {
    if (hasUploadedDeals) return uploadedDeals;
    return MASTER_DEALS;
  }, [hasUploadedDeals, uploadedDeals]);

  const effectiveBooked = useMemo(() => {
    if (hasRevenueData) return bookedByRepMonth;
    return MASTER_BOOKED;
  }, [hasRevenueData, bookedByRepMonth]);

  const effectiveTargets = useMemo(() => {
    if (hasRevenueData) return targetsByRepMonth;
    return MASTER_TARGETS;
  }, [hasRevenueData, targetsByRepMonth]);

  if (!config) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Rep header */}
      <RepHeader config={config} />

      {/* Scorecard */}
      <ScorecardPanel config={config} booked={effectiveBooked} targets={effectiveTargets} />

      {/* Vendasta empty state */}
      {repKey === "vendasta" && (
        <div className="mt-6 text-center py-12">
          <p className="text-muted text-sm">
            Vendasta deals are tracked under George&apos;s pipeline
          </p>
        </div>
      )}

      {/* Deal pipeline (for non-Vendasta reps) */}
      {repKey !== "vendasta" && (
        <FocusedPipeline
          deals={allDeals}
          rep={repKey}
          onDealClick={setSelectedDeal}
          onResearchClick={setResearchDeal}
        />
      )}

      {/* Deal drawer */}
      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />

      {/* Research request modal */}
      {researchDeal && (
        <ResearchRequestModal deal={researchDeal} onClose={() => setResearchDeal(null)} />
      )}
    </div>
  );
}
