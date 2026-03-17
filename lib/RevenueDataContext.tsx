"use client";

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";

const BOOKED_CACHE_KEY = "adcellerant_booked_cache";
const TARGETS_CACHE_KEY = "adcellerant_targets_cache";
const DATA_SOURCE_KEY = "adcellerant_data_source";

export type DataSource = "mock" | "csv" | "live";

interface RevenueState {
  bookedByRepMonth: BookedByRepMonth;
  targetsByRepMonth: TargetsByRepMonth;
  dataSource: DataSource;
}

type RevenueAction =
  | { type: "SET_BOOKED"; booked: BookedByRepMonth }
  | { type: "SET_TARGETS"; targets: TargetsByRepMonth }
  | { type: "MERGE_BOOKED"; booked: BookedByRepMonth }
  | { type: "SET_DATA_SOURCE"; source: DataSource }
  | { type: "RESET" };

function reducer(state: RevenueState, action: RevenueAction): RevenueState {
  switch (action.type) {
    case "SET_BOOKED":
      return { ...state, bookedByRepMonth: action.booked };
    case "SET_TARGETS":
      return { ...state, targetsByRepMonth: action.targets };
    case "MERGE_BOOKED":
      return { ...state, bookedByRepMonth: { ...state.bookedByRepMonth, ...action.booked } };
    case "SET_DATA_SOURCE":
      return { ...state, dataSource: action.source };
    case "RESET":
      return { bookedByRepMonth: {}, targetsByRepMonth: {}, dataSource: "mock" };
    default:
      return state;
  }
}

interface RevenueContextValue {
  bookedByRepMonth: BookedByRepMonth;
  targetsByRepMonth: TargetsByRepMonth;
  dataSource: DataSource;
  hasRevenueData: boolean;
  loadRevenueData: (data: { booked?: BookedByRepMonth; targets?: TargetsByRepMonth }) => void;
  resetRevenueData: () => void;
  setDataSource: (source: DataSource) => void;
}

const RevenueContext = createContext<RevenueContextValue | null>(null);

export function RevenueDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    bookedByRepMonth: {},
    targetsByRepMonth: {},
    dataSource: "mock",
  });

  // Restore from localStorage on mount
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const cachedBooked = localStorage.getItem(BOOKED_CACHE_KEY);
      const cachedTargets = localStorage.getItem(TARGETS_CACHE_KEY);
      const cachedSource = localStorage.getItem(DATA_SOURCE_KEY) as DataSource | null;
      if (cachedBooked) {
        const booked = JSON.parse(cachedBooked) as BookedByRepMonth;
        if (Object.keys(booked).length > 0) {
          dispatch({ type: "SET_BOOKED", booked });
        }
      }
      if (cachedTargets) {
        const targets = JSON.parse(cachedTargets) as TargetsByRepMonth;
        if (Object.keys(targets).length > 0) {
          dispatch({ type: "SET_TARGETS", targets });
        }
      }
      if (cachedSource) {
        dispatch({ type: "SET_DATA_SOURCE", source: cachedSource });
      }
    } catch { /* ignore */ }
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(BOOKED_CACHE_KEY, JSON.stringify(state.bookedByRepMonth));
      localStorage.setItem(TARGETS_CACHE_KEY, JSON.stringify(state.targetsByRepMonth));
      localStorage.setItem(DATA_SOURCE_KEY, state.dataSource);
    } catch { /* ignore */ }
  }, [state.bookedByRepMonth, state.targetsByRepMonth, state.dataSource]);

  const loadRevenueData = useCallback(
    (data: { booked?: BookedByRepMonth; targets?: TargetsByRepMonth }) => {
      if (data.booked) {
        dispatch({ type: "MERGE_BOOKED", booked: data.booked });
      }
      if (data.targets) {
        dispatch({ type: "SET_TARGETS", targets: data.targets });
      }
      dispatch({ type: "SET_DATA_SOURCE", source: "csv" });
    },
    []
  );

  const resetRevenueData = useCallback(() => {
    dispatch({ type: "RESET" });
    try {
      localStorage.removeItem(BOOKED_CACHE_KEY);
      localStorage.removeItem(TARGETS_CACHE_KEY);
      localStorage.removeItem(DATA_SOURCE_KEY);
    } catch { /* ignore */ }
  }, []);

  const setDataSource = useCallback((source: DataSource) => {
    dispatch({ type: "SET_DATA_SOURCE", source });
  }, []);

  const hasRevenueData =
    Object.keys(state.bookedByRepMonth).length > 0 ||
    Object.keys(state.targetsByRepMonth).length > 0;

  return (
    <RevenueContext.Provider
      value={{
        bookedByRepMonth: state.bookedByRepMonth,
        targetsByRepMonth: state.targetsByRepMonth,
        dataSource: state.dataSource,
        hasRevenueData,
        loadRevenueData,
        resetRevenueData,
        setDataSource,
      }}
    >
      {children}
    </RevenueContext.Provider>
  );
}

export function useRevenueData() {
  const ctx = useContext(RevenueContext);
  if (!ctx) throw new Error("useRevenueData must be used within RevenueDataProvider");
  return ctx;
}
