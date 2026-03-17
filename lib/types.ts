import type { ParsedDeal } from "./hubspot";

export interface BookedEntry {
  rep: string;
  month: string;
  amount: number;
}

export interface TargetEntry {
  rep: string;
  month: string;
  target: number;
}

export type BookedByRepMonth = Record<string, Record<string, number>>;
export type TargetsByRepMonth = Record<string, Record<string, number>>;

export interface AppState {
  deals: ParsedDeal[];
  bookedByRepMonth: BookedByRepMonth;
  targetsByRepMonth: TargetsByRepMonth;
  dealsLoading: boolean;
  dealsError: string | null;
  hubspotUnavailable: boolean;
}

export type AppAction =
  | { type: "SET_DEALS"; deals: ParsedDeal[] }
  | { type: "SET_DEALS_LOADING"; loading: boolean }
  | { type: "SET_DEALS_ERROR"; error: string | null }
  | { type: "SET_HUBSPOT_UNAVAILABLE"; unavailable: boolean };
