"use client";

import { useReducer, useEffect, useCallback, useState } from "react";
import type { AppState, AppAction } from "@/lib/types";
import type { ParsedDeal } from "@/lib/hubspot";
import { parseBookedCSV, parseExcelWorkbook } from "@/lib/parsers";
import FileUpload from "./FileUpload";
import LoadingSpinner from "./LoadingSpinner";
import TeamGrid from "./TeamGrid";

const CACHE_KEY = "adcellerant_deals_cache";

function loadCachedDeals(): ParsedDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

function cacheDeals(deals: ParsedDeal[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(deals));
  } catch {}
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

  // Fetch deals on mount
  useEffect(() => {
    async function loadDeals() {
      dispatch({ type: "SET_DEALS_LOADING", loading: true });
      try {
        const res = await fetch("/api/hubspot/deals");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        dispatch({ type: "SET_DEALS", deals: data.deals });
        cacheDeals(data.deals);
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
    }
    loadDeals();
  }, []);

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
  }, [setCsvLoading, setCsvError, setCsvSuccess]);

  const handleExcel = useCallback(async (file: File) => {
    setXlLoading(true);
    setXlError(null);
    setXlSuccess(false);
    try {
      const { booked, targets } = await parseExcelWorkbook(file);
      // Merge Excel booked data with any existing booked data
      dispatch({ type: "SET_BOOKED", booked: { ...state.bookedByRepMonth, ...booked } });
      dispatch({ type: "SET_TARGETS", targets });
      setXlSuccess(true);
    } catch (err) {
      setXlError(err instanceof Error ? err.message : "Excel parse error");
    } finally {
      setXlLoading(false);
    }
  }, [setXlLoading, setXlError, setXlSuccess, state.bookedByRepMonth]);

  // Computed stats
  const totalPipeline = state.deals.reduce((sum, d) => sum + d.val, 0);
  const dealCount = state.deals.length;
  const repDeals = rep ? state.deals.filter((d) => d.rep === rep) : state.deals;
  const repPipeline = repDeals.reduce((sum, d) => sum + d.val, 0);

  const totalBooked = Object.values(state.bookedByRepMonth).reduce(
    (sum, months) => sum + Object.values(months).reduce((s, v) => s + v, 0),
    0
  );

  const hasTargets = Object.keys(state.targetsByRepMonth).length > 0;

  return (
    <div>
      {/* Welcome */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Welcome, {userName || "User"}
        </h2>
        <p className="text-muted text-sm">
          Logged in as <span className="text-blue">{userEmail}</span>
          {rep && (
            <>
              {" "}&mdash; Rep: <span className="text-orange font-semibold">{rep}</span>
            </>
          )}
        </p>
      </div>

      {/* HubSpot warning */}
      {state.hubspotUnavailable && (
        <div className="mt-4 bg-amber/10 border border-amber/30 rounded-xl p-4">
          <p className="text-amber text-sm font-medium">
            HubSpot unavailable &mdash; showing last session
          </p>
        </div>
      )}

      {/* Deals loading / error */}
      {state.dealsLoading && <LoadingSpinner message="Loading HubSpot deals..." />}

      {state.dealsError && !state.hubspotUnavailable && (
        <div className="mt-4 bg-orange/10 border border-orange/30 rounded-xl p-4">
          <p className="text-orange text-sm font-medium">Failed to load deals</p>
          <p className="text-muted text-xs mt-1">{state.dealsError}</p>
        </div>
      )}

      {/* Stats cards */}
      {!state.dealsLoading && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Pipeline</p>
            <p className="text-2xl font-bold text-orange">
              {formatCurrency(rep ? repPipeline : totalPipeline)}
            </p>
            <p className="text-muted text-xs mt-1">
              {rep ? repDeals.length : dealCount} active deal{(rep ? repDeals.length : dealCount) !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Booked Revenue</p>
            <p className="text-2xl font-bold text-green">
              {totalBooked > 0 ? formatCurrency(totalBooked) : "—"}
            </p>
            <p className="text-muted text-xs mt-1">
              {totalBooked > 0 ? "From uploaded CSV/Excel" : "Upload CSV to populate"}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Target Tracking</p>
            <p className="text-2xl font-bold text-white">
              {hasTargets ? "Loaded" : "—"}
            </p>
            <p className="text-muted text-xs mt-1">
              {hasTargets ? "Targets imported from Excel" : "Upload Excel to populate"}
            </p>
          </div>
        </div>
      )}

      {/* File uploads */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Team grid with rep cards + deal tabs */}
      {!state.dealsLoading && (
        <div className="mt-6">
          <TeamGrid
            deals={state.deals}
            booked={state.bookedByRepMonth}
            targets={state.targetsByRepMonth}
            focusedRep={rep}
          />
        </div>
      )}
    </div>
  );
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

