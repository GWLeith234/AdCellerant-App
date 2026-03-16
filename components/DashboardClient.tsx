"use client";

import { useReducer, useEffect, useCallback, useState, useRef } from "react";
import type { AppState, AppAction } from "@/lib/types";
import type { ParsedDeal } from "@/lib/hubspot";
import { parseBookedCSV, parseExcelWorkbook } from "@/lib/parsers";
import { getRepConfig } from "@/lib/reps";
import FileUpload from "./FileUpload";
import DealGridSkeleton from "./DealGridSkeleton";
import TeamGrid from "./TeamGrid";
import ScorecardStrip from "./ScorecardStrip";
import FocusedPipeline from "./FocusedPipeline";
import DealDrawer from "./DealDrawer";
import ResearchRequestModal from "./ResearchRequestModal";

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

  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const [xlLoading, setXlLoading] = useState(false);
  const [xlSuccess, setXlSuccess] = useState(false);
  const [xlError, setXlError] = useState<string | null>(null);

  const [selectedDeal, setSelectedDeal] = useState<ParsedDeal | null>(null);
  const [researchDeal, setResearchDeal] = useState<ParsedDeal | null>(null);
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

  const handleCSV = useCallback(async (file: File) => {
    setCsvLoading(true);
    setCsvError(null);
    setCsvSuccess(false);
    try {
      const booked = await parseBookedCSV(file);
      dispatch({ type: "SET_BOOKED", booked });
      setCsvSuccess(true);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "CSV parse error");
    } finally {
      setCsvLoading(false);
    }
  }, []);

  const handleExcel = useCallback(async (file: File) => {
    setXlLoading(true);
    setXlError(null);
    setXlSuccess(false);
    try {
      const { booked, targets } = await parseExcelWorkbook(file);
      dispatch({ type: "SET_BOOKED", booked: { ...state.bookedByRepMonth, ...booked } });
      dispatch({ type: "SET_TARGETS", targets });
      setXlSuccess(true);
    } catch (err) {
      setXlError(err instanceof Error ? err.message : "Excel parse error");
    } finally {
      setXlLoading(false);
    }
  }, [state.bookedByRepMonth]);

  const repConfig = rep ? getRepConfig(rep) : null;
  const isFocused = !!rep && !!repConfig;

  return (
    <div>
      {/* Refresh bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {state.hubspotUnavailable && (
            <span className="text-amber text-xs bg-amber/10 border border-amber/30 px-2.5 py-1 rounded-lg">
              HubSpot unavailable — showing cached data
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

      {/* File uploads */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUpload
          label="Upload Booked Revenue CSV"
          accept=".csv"
          hint="Drag & drop or click — columns: rep, month, amount"
          onFile={handleCSV}
          loading={csvLoading}
          success={csvSuccess}
          error={csvError}
        />
        <FileUpload
          label="Upload WoW Analysis Excel"
          accept=".xlsx,.xls"
          hint="Drag & drop or click — sheets: WoW Tracker, Targets"
          onFile={handleExcel}
          loading={xlLoading}
          success={xlSuccess}
          error={xlError}
        />
      </div>

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
