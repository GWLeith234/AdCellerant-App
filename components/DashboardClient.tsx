"use client";

import { useReducer, useEffect, useCallback, useState, useRef } from "react";
import type { AppAction } from "@/lib/types";
import type { ParsedDeal } from "@/lib/hubspot";
import { getRepConfig } from "@/lib/reps";
import { useRevenueData } from "@/lib/RevenueDataContext";
import { useDealData } from "@/lib/DealDataContext";
import DealGridSkeleton from "./DealGridSkeleton";
import TeamGrid from "./TeamGrid";
import ScorecardPanel from "./ScorecardPanel";
import RepHeader from "./RepHeader";
import FocusedPipeline from "./FocusedPipeline";
import DealDrawer from "./DealDrawer";
import ResearchRequestModal from "./ResearchRequestModal";
import SubNav from "./SubNav";

const CACHE_KEY = "adcellerant_deals_cache";

function loadCachedDeals(): ParsedDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached) as ParsedDeal[];
  } catch { /* ignore */ }
  return [];
}

function cacheDeals(deals: ParsedDeal[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(deals));
  } catch { /* ignore */ }
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

interface DashboardClientProps {
  userEmail: string;
  userName: string;
  rep: string | null;
}

export default function DashboardClient({ userEmail, userName, rep }: DashboardClientProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { bookedByRepMonth, targetsByRepMonth } = useRevenueData();
  const { uploadedDeals, hasUploadedDeals } = useDealData();

  const [selectedDeal, setSelectedDeal] = useState<ParsedDeal | null>(null);
  const [researchDeal, setResearchDeal] = useState<ParsedDeal | null>(null);

  // Open drawer and scroll to research section
  const handleResearchClick = useCallback((deal: ParsedDeal) => {
    setSelectedDeal(deal);
    setTimeout(() => {
      document.getElementById("research-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, []);
  const [refreshing, setRefreshing] = useState(false);

  // Track last refresh timestamp
  const lastRefreshRef = useRef<string>("");

  // Fetch deals
  const loadDeals = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      dispatch({ type: "SET_DEALS_LOADING", loading: true });
    }
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
      cacheDeals(data.deals);
      lastRefreshRef.current = new Date().toLocaleTimeString();
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
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Use uploaded deals if available, otherwise fall back to API-loaded deals
  const activeDeals = hasUploadedDeals ? uploadedDeals : state.deals;
  const isMock = hasUploadedDeals ? false : state.hubspotUnavailable;

  const repConfig = rep ? getRepConfig(rep) : null;
  const isFocused = !!rep && !!repConfig;

  return (
    <div>
      {/* Sub-navigation bar */}
      <SubNav
        rep={rep}
        userEmail={userEmail}
        refreshing={refreshing}
        dealsLoading={state.dealsLoading && !hasUploadedDeals}
        isMock={isMock}
        onRefresh={() => loadDeals(true)}
      />

      {/* Error banner */}
      {state.dealsError && !isMock && !hasUploadedDeals && (
        <div className="mb-4">
          <span className="text-orange text-xs bg-orange/10 border border-orange/30 px-2.5 py-1 rounded-lg">
            {state.dealsError}
          </span>
        </div>
      )}

      {/* Deals loading skeleton */}
      {state.dealsLoading && !hasUploadedDeals && (
        <div className="mb-6">
          <DealGridSkeleton count={8} columns={isFocused ? 3 : 4} />
        </div>
      )}

      {/* Focused rep view */}
      {(!state.dealsLoading || hasUploadedDeals) && isFocused && repConfig && (
        <>
          <RepHeader config={repConfig} />
          <ScorecardPanel
            config={repConfig}
            booked={bookedByRepMonth}
            targets={targetsByRepMonth}
          />
          <FocusedPipeline deals={activeDeals} rep={rep} onDealClick={setSelectedDeal} onResearchClick={handleResearchClick} />
        </>
      )}

      {/* Team view */}
      {(!state.dealsLoading || hasUploadedDeals) && !isFocused && (
        <TeamGrid
          deals={activeDeals}
          booked={bookedByRepMonth}
          targets={targetsByRepMonth}
          onDealClick={setSelectedDeal}
          onResearchClick={handleResearchClick}
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
