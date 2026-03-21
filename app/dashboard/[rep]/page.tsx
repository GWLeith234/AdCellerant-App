"use client";

import { useParams } from "next/navigation";
import { useReducer, useEffect, useCallback, useState, useRef } from "react";
import type { AppAction } from "@/lib/types";
import type { ParsedDeal } from "@/lib/hubspot";
import { getRepConfig, REP_CONFIGS } from "@/lib/reps";
import { useRevenueData } from "@/lib/RevenueDataContext";
import { useDealData } from "@/lib/DealDataContext";
import RepHeader from "@/components/RepHeader";
import ScorecardStrip from "@/components/ScorecardStrip";
import PipelineView from "@/components/PipelineView";
import DealDrawer from "@/components/DealDrawer";
import DealGridSkeleton from "@/components/DealGridSkeleton";
import ResearchRequestModal from "@/components/ResearchRequestModal";

const CACHE_KEY = "adcellerant_deals_cache";

function loadCachedDeals(): ParsedDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached) as ParsedDeal[];
  } catch { /* ignore */ }
  return [];
}

interface DealState {
  deals: ParsedDeal[];
  dealsLoading: boolean;
  dealsError: string | null;
  hubspotUnavailable: boolean;
}

const initialState: DealState = {
  deals: [],
  dealsLoading: true,
  dealsError: null,
  hubspotUnavailable: false,
};

function reducer(state: DealState, action: AppAction): DealState {
  switch (action.type) {
    case "SET_DEALS":
      return { ...state, deals: action.deals, dealsLoading: false, dealsError: null, hubspotUnavailable: false };
    case "SET_DEALS_LOADING":
      return { ...state, dealsLoading: action.loading };
    case "SET_DEALS_ERROR":
      return { ...state, dealsError: action.error, dealsLoading: false };
    case "SET_HUBSPOT_UNAVAILABLE":
      return { ...state, hubspotUnavailable: action.unavailable, dealsLoading: false };
    default:
      return state;
  }
}

export default function RepPage() {
  const params = useParams();
  const repKey = typeof params.rep === "string" ? params.rep : "";
  const config = getRepConfig(repKey);

  const [state, dispatch] = useReducer(reducer, initialState);
  const { bookedByRepMonth, targetsByRepMonth } = useRevenueData();
  const { uploadedDeals, hasUploadedDeals } = useDealData();

  const [selectedDeal, setSelectedDeal] = useState<ParsedDeal | null>(null);
  const [researchDeal, setResearchDeal] = useState<ParsedDeal | null>(null);

  const loadDeals = useCallback(async () => {
    dispatch({ type: "SET_DEALS_LOADING", loading: true });
    try {
      const res = await fetch("/api/hubspot/deals");
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `API error: ${res.status}`);
      }
      dispatch({ type: "SET_DEALS", deals: data.deals });
      if (data.mock) {
        dispatch({ type: "SET_HUBSPOT_UNAVAILABLE", unavailable: true });
      }
    } catch (err) {
      const cached = loadCachedDeals();
      if (cached.length > 0) {
        dispatch({ type: "SET_DEALS", deals: cached });
        dispatch({ type: "SET_HUBSPOT_UNAVAILABLE", unavailable: true });
      } else {
        dispatch({
          type: "SET_DEALS_ERROR",
          error: err instanceof Error ? err.message : "Failed to load deals",
        });
      }
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const activeDeals = hasUploadedDeals ? uploadedDeals : state.deals;

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-muted text-sm">Rep &quot;{repKey}&quot; not found.</p>
      </div>
    );
  }

  return (
    <div>
      <RepHeader config={config} />

      <ScorecardStrip config={config} booked={bookedByRepMonth} targets={targetsByRepMonth} />

      {/* Error banner */}
      {state.dealsError && !hasUploadedDeals && (
        <div className="mb-4 mt-4">
          <span className="text-orange text-xs bg-orange/10 border border-orange/30 px-2.5 py-1 rounded-lg">
            {state.dealsError}
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {state.dealsLoading && !hasUploadedDeals && (
        <div className="mb-6 mt-4">
          <DealGridSkeleton count={6} columns={4} />
        </div>
      )}

      {/* Pipeline view filtered to this rep */}
      {(!state.dealsLoading || hasUploadedDeals) && (
        <PipelineView
          deals={activeDeals}
          repFilter={repKey}
          onDealClick={setSelectedDeal}
          onResearchClick={setResearchDeal}
        />
      )}

      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />

      {researchDeal && (
        <ResearchRequestModal deal={researchDeal} onClose={() => setResearchDeal(null)} />
      )}
    </div>
  );
}
