"use client";

import { useReducer, useEffect, useCallback, useState, useRef, useMemo } from "react";
import type { AppAction } from "@/lib/types";
import type { ParsedDeal } from "@/lib/hubspot";
import { useRevenueData } from "@/lib/RevenueDataContext";
import { useDealData } from "@/lib/DealDataContext";
import { getAllDeals, getMasterBooked, getMasterTargets } from "@/lib/dataProvider";
import DealGridSkeleton from "./DealGridSkeleton";
import TeamGrid from "./TeamGrid";
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
}

// Master data deals (loaded once at module level)
const MASTER_DEALS = getAllDeals();
const MASTER_BOOKED = getMasterBooked();
const MASTER_TARGETS = getMasterTargets();

export default function DashboardClient({ userEmail, userName }: DashboardClientProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { bookedByRepMonth, targetsByRepMonth, hasRevenueData } = useRevenueData();
  const { uploadedDeals, hasUploadedDeals } = useDealData();

  const [selectedDeal, setSelectedDeal] = useState<ParsedDeal | null>(null);
  const [researchDeal, setResearchDeal] = useState<ParsedDeal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Track last refresh timestamp
  const lastRefreshRef = useRef<string>("");

  // Fetch deals from API (fallback)
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
        // Fall through — master data will be used
        dispatch({ type: "SET_DEALS", deals: [] });
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Listen for refresh events from Topbar
  useEffect(() => {
    const handler = () => loadDeals(true);
    window.addEventListener("adcellerant:refresh", handler);
    return () => window.removeEventListener("adcellerant:refresh", handler);
  }, [loadDeals]);

  // Data priority: CSV uploads > API deals > master data
  const activeDeals = useMemo(() => {
    if (hasUploadedDeals) return uploadedDeals;
    if (state.deals.length > 0) return state.deals;
    return MASTER_DEALS;
  }, [hasUploadedDeals, uploadedDeals, state.deals]);

  // Revenue data priority: uploaded Excel/CSV > master data
  const effectiveBooked = useMemo(() => {
    if (hasRevenueData) return bookedByRepMonth;
    return MASTER_BOOKED;
  }, [hasRevenueData, bookedByRepMonth]);

  const effectiveTargets = useMemo(() => {
    if (hasRevenueData) return targetsByRepMonth;
    return MASTER_TARGETS;
  }, [hasRevenueData, targetsByRepMonth]);

  const isMock = false; // master data is always available

  return (
    <div>
      {/* Sub-navigation bar */}
      <SubNav
        rep={null}
        userEmail={userEmail}
        refreshing={refreshing}
        dealsLoading={state.dealsLoading && !hasUploadedDeals && MASTER_DEALS.length === 0}
        isMock={isMock}
        onRefresh={() => loadDeals(true)}
      />

      {/* Team view — always render since master data is available */}
      <TeamGrid
        deals={activeDeals}
        booked={effectiveBooked}
        targets={effectiveTargets}
        onDealClick={setSelectedDeal}
        onResearchClick={setResearchDeal}
      />

      {/* Deal drawer */}
      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />

      {/* Research request modal */}
      {researchDeal && (
        <ResearchRequestModal deal={researchDeal} onClose={() => setResearchDeal(null)} />
      )}
    </div>
  );
}
