"use client";

import { useReducer, useEffect, useCallback, useState, useRef } from "react";
import type { AppState, AppAction, BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";
import type { ParsedDeal } from "@/lib/hubspot";
import { getRepConfig } from "@/lib/reps";
import DataUploadPanel from "./DataUploadPanel";
import DealGridSkeleton from "./DealGridSkeleton";
import TeamGrid from "./TeamGrid";
import ScorecardStrip from "./ScorecardStrip";
import FocusedPipeline from "./FocusedPipeline";
import DealDrawer from "./DealDrawer";
import ResearchRequestModal from "./ResearchRequestModal";

const CACHE_KEY = "adcellerant_deals_cache";
const BOOKED_CACHE_KEY = "adcellerant_booked_cache";
const TARGETS_CACHE_KEY = "adcellerant_targets_cache";

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

function loadCachedBooked(): BookedByRepMonth {
  if (typeof window === "undefined") return {};
  try {
    const cached = localStorage.getItem(BOOKED_CACHE_KEY);
    if (cached) return JSON.parse(cached) as BookedByRepMonth;
  } catch { /* ignore */ }
  return {};
}

function loadCachedTargets(): TargetsByRepMonth {
  if (typeof window === "undefined") return {};
  try {
    const cached = localStorage.getItem(TARGETS_CACHE_KEY);
    if (cached) return JSON.parse(cached) as TargetsByRepMonth;
  } catch { /* ignore */ }
  return {};
}

function cacheBooked(booked: BookedByRepMonth) {
  try {
    localStorage.setItem(BOOKED_CACHE_KEY, JSON.stringify(booked));
  } catch { /* ignore */ }
}

function cacheTargets(targets: TargetsByRepMonth) {
  try {
    localStorage.setItem(TARGETS_CACHE_KEY, JSON.stringify(targets));
  } catch { /* ignore */ }
}

const initialState: AppState = {
  deals: [],
  bookedByRepMonth: {},
  targetsByRepMonth: {},
  dealsLoading: true,
  dealsError: null,
  hubspotUnavailable: false,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_DEALS":
      return { ...state, deals: action.deals, dealsLoading: false, dealsError: null, hubspotUnavailable: false };
    case "SET_DEALS_LOADING":
      return { ...state, dealsLoading: action.loading };
    case "SET_DEALS_ERROR":
      return { ...state, dealsError: action.error, dealsLoading: false };
    case "SET_HUBSPOT_UNAVAILABLE":
      return { ...state, hubspotUnavailable: action.unavailable, dealsLoading: false };
    case "SET_BOOKED":
      return { ...state, bookedByRepMonth: action.booked };
    case "SET_TARGETS":
      return { ...state, targetsByRepMonth: action.targets };
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

  const [selectedDeal, setSelectedDeal] = useState<ParsedDeal | null>(null);
  const [researchDeal, setResearchDeal] = useState<ParsedDeal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Track last refresh timestamp
  const lastRefreshRef = useRef<string>("");

  // Restore persisted booked/targets on mount
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const booked = loadCachedBooked();
    const targets = loadCachedTargets();
    if (Object.keys(booked).length > 0) {
      dispatch({ type: "SET_BOOKED", booked });
    }
    if (Object.keys(targets).length > 0) {
      dispatch({ type: "SET_TARGETS", targets });
    }
  }, []);

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

  // Handle data loaded from upload panel
  const handleDataLoaded = useCallback(
    (data: { booked?: BookedByRepMonth; targets?: TargetsByRepMonth }) => {
      if (data.booked) {
        const merged = { ...state.bookedByRepMonth, ...data.booked };
        dispatch({ type: "SET_BOOKED", booked: merged });
        cacheBooked(merged);
      }
      if (data.targets) {
        dispatch({ type: "SET_TARGETS", targets: data.targets });
        cacheTargets(data.targets);
      }
    },
    [state.bookedByRepMonth]
  );

  const hasRevenueData =
    Object.keys(state.bookedByRepMonth).length > 0 ||
    Object.keys(state.targetsByRepMonth).length > 0;

  const repConfig = rep ? getRepConfig(rep) : null;
  const isFocused = !!rep && !!repConfig;

  return (
    <div>
      {/* Refresh bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {state.hubspotUnavailable && (
            <span className="text-amber text-xs bg-amber/10 border border-amber/30 px-2.5 py-1 rounded-lg">
              Using mock data — set HUBSPOT_ACCESS_TOKEN for live deals
            </span>
          )}
          {state.dealsError && !state.hubspotUnavailable && (
            <span className="text-orange text-xs bg-orange/10 border border-orange/30 px-2.5 py-1 rounded-lg">
              {state.dealsError}
            </span>
          )}
        </div>
        <button
          onClick={() => loadDeals(true)}
          disabled={refreshing || state.dealsLoading}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-white bg-navy/50 hover:bg-card border border-border px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh HubSpot deals"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={refreshing ? "animate-spin" : ""}
          >
            <path d="M1 7a6 6 0 0111.2-3M13 7a6 6 0 01-11.2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12.2 1v3h-3M1.8 13v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Deals loading skeleton */}
      {state.dealsLoading && (
        <div className="mb-6">
          <DealGridSkeleton count={8} columns={isFocused ? 3 : 4} />
        </div>
      )}

      {/* Data upload panel */}
      <DataUploadPanel
        onDataLoaded={handleDataLoaded}
        hasExistingData={hasRevenueData}
      />

      {/* Focused rep view */}
      {!state.dealsLoading && isFocused && repConfig && (
        <>
          <ScorecardStrip
            config={repConfig}
            booked={state.bookedByRepMonth}
            targets={state.targetsByRepMonth}
          />
          <FocusedPipeline deals={state.deals} rep={rep} onDealClick={setSelectedDeal} onResearchClick={setResearchDeal} />
        </>
      )}

      {/* Team view */}
      {!state.dealsLoading && !isFocused && (
        <TeamGrid
          deals={state.deals}
          booked={state.bookedByRepMonth}
          targets={state.targetsByRepMonth}
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
