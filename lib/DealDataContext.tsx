"use client";

import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import type { ParsedDeal } from "./hubspot";

const DEALS_CACHE_KEY = "adcellerant_uploaded_deals";

interface DealDataState {
  uploadedDeals: ParsedDeal[];
  hasUploadedDeals: boolean;
}

type DealDataAction =
  | { type: "SET_DEALS"; deals: ParsedDeal[] }
  | { type: "RESET" };

function reducer(state: DealDataState, action: DealDataAction): DealDataState {
  switch (action.type) {
    case "SET_DEALS":
      return { uploadedDeals: action.deals, hasUploadedDeals: action.deals.length > 0 };
    case "RESET":
      return { uploadedDeals: [], hasUploadedDeals: false };
    default:
      return state;
  }
}

interface DealDataContextValue {
  uploadedDeals: ParsedDeal[];
  hasUploadedDeals: boolean;
  loadUploadedDeals: (deals: ParsedDeal[]) => void;
  resetUploadedDeals: () => void;
}

const DealDataContext = createContext<DealDataContextValue | null>(null);

export function DealDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    uploadedDeals: [],
    hasUploadedDeals: false,
  });

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(DEALS_CACHE_KEY);
      if (cached) {
        const deals = JSON.parse(cached) as ParsedDeal[];
        if (deals.length > 0) {
          dispatch({ type: "SET_DEALS", deals });
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      if (state.hasUploadedDeals) {
        localStorage.setItem(DEALS_CACHE_KEY, JSON.stringify(state.uploadedDeals));
      } else {
        localStorage.removeItem(DEALS_CACHE_KEY);
      }
    } catch { /* ignore */ }
  }, [state.uploadedDeals, state.hasUploadedDeals]);

  const loadUploadedDeals = useCallback((deals: ParsedDeal[]) => {
    dispatch({ type: "SET_DEALS", deals });
  }, []);

  const resetUploadedDeals = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <DealDataContext.Provider
      value={{
        uploadedDeals: state.uploadedDeals,
        hasUploadedDeals: state.hasUploadedDeals,
        loadUploadedDeals,
        resetUploadedDeals,
      }}
    >
      {children}
    </DealDataContext.Provider>
  );
}

export function useDealData() {
  const ctx = useContext(DealDataContext);
  if (!ctx) throw new Error("useDealData must be used within DealDataProvider");
  return ctx;
}
