"use client";

import { useState, useCallback } from "react";
import FileUpload, { type UploadZoneState } from "./FileUpload";
import { parseBookedCSV, parseExcelWorkbook, parseHubSpotDealsCSV } from "@/lib/parsers";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";
import type { ParsedDeal } from "@/lib/hubspot";

interface DataUploadPanelProps {
  onDataLoaded: (data: {
    booked?: BookedByRepMonth;
    targets?: TargetsByRepMonth;
  }) => void;
  /** Called when HubSpot deals CSV is loaded */
  onDealsLoaded?: (deals: ParsedDeal[]) => void;
  /** True if data has already been loaded (e.g. from localStorage) */
  hasExistingData?: boolean;
  /** True if deal data has been uploaded */
  hasExistingDeals?: boolean;
}

export default function DataUploadPanel({
  onDataLoaded,
  onDealsLoaded,
  hasExistingData = false,
  hasExistingDeals = false,
}: DataUploadPanelProps) {
  // Staged files (not yet processed)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [xlFile, setXlFile] = useState<File | null>(null);
  const [dealsFile, setDealsFile] = useState<File | null>(null);

  // Zone states
  const [csvState, setCsvState] = useState<UploadZoneState>(
    hasExistingData ? "loaded" : "empty"
  );
  const [xlState, setXlState] = useState<UploadZoneState>(
    hasExistingData ? "loaded" : "empty"
  );
  const [dealsState, setDealsState] = useState<UploadZoneState>(
    hasExistingDeals ? "loaded" : "empty"
  );

  // File names for display
  const [csvStagedName, setCsvStagedName] = useState<string | null>(null);
  const [xlStagedName, setXlStagedName] = useState<string | null>(null);
  const [dealsStagedName, setDealsStagedName] = useState<string | null>(null);
  const [csvLoadedName, setCsvLoadedName] = useState<string | null>(
    hasExistingData ? "revenue.csv" : null
  );
  const [xlLoadedName, setXlLoadedName] = useState<string | null>(
    hasExistingData ? "analysis.xlsx" : null
  );
  const [dealsLoadedName, setDealsLoadedName] = useState<string | null>(
    hasExistingDeals ? "deals.csv" : null
  );
  const [dealsCount, setDealsCount] = useState<number>(0);

  // Errors
  const [csvError, setCsvError] = useState<string | null>(null);
  const [xlError, setXlError] = useState<string | null>(null);
  const [dealsError, setDealsError] = useState<string | null>(null);

  // Loading state
  const [processing, setProcessing] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(hasExistingData);

  const handleCsvStage = useCallback((file: File | null) => {
    if (file) {
      setCsvFile(file);
      setCsvStagedName(file.name);
      setCsvState("staged");
      setCsvError(null);
      setLoadSuccess(false);
    } else {
      setCsvFile(null);
      setCsvStagedName(null);
      setCsvState("empty");
      setCsvError(null);
    }
  }, []);

  const handleXlStage = useCallback((file: File | null) => {
    if (file) {
      setXlFile(file);
      setXlStagedName(file.name);
      setXlState("staged");
      setXlError(null);
      setLoadSuccess(false);
    } else {
      setXlFile(null);
      setXlStagedName(null);
      setXlState("empty");
      setXlError(null);
    }
  }, []);

  const handleDealsStage = useCallback((file: File | null) => {
    if (file) {
      setDealsFile(file);
      setDealsStagedName(file.name);
      setDealsState("staged");
      setDealsError(null);
      setLoadSuccess(false);
    } else {
      setDealsFile(null);
      setDealsStagedName(null);
      setDealsState("empty");
      setDealsError(null);
    }
  }, []);

  const handleLoad = useCallback(async () => {
    setProcessing(true);
    setCsvError(null);
    setXlError(null);

    let booked: BookedByRepMonth | undefined;
    let targets: TargetsByRepMonth | undefined;
    let hadError = false;

    // Process CSV if staged
    if (csvFile) {
      try {
        booked = await parseBookedCSV(csvFile);
        setCsvState("loaded");
        setCsvLoadedName(csvFile.name);
        setCsvStagedName(null);
        setCsvFile(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "CSV parse error";
        setCsvError(msg);
        setCsvState("error");
        hadError = true;
      }
    }

    // Process Excel if staged
    if (xlFile) {
      try {
        const result = await parseExcelWorkbook(xlFile);
        booked = booked
          ? { ...booked, ...result.booked }
          : result.booked;
        targets = result.targets;
        setXlState("loaded");
        setXlLoadedName(xlFile.name);
        setXlStagedName(null);
        setXlFile(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Excel parse error";
        setXlError(msg);
        setXlState("error");
        hadError = true;
      }
    }

    // Process HubSpot deals CSV if staged
    if (dealsFile) {
      try {
        const parsedDeals = await parseHubSpotDealsCSV(dealsFile);
        setDealsState("loaded");
        setDealsLoadedName(dealsFile.name);
        setDealsStagedName(null);
        setDealsFile(null);
        setDealsCount(parsedDeals.length);
        onDealsLoaded?.(parsedDeals);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Deals CSV parse error";
        setDealsError(msg);
        setDealsState("error");
        hadError = true;
      }
    }

    // Dispatch results if any succeeded
    if (booked || targets) {
      onDataLoaded({ booked, targets });
    }

    if (!hadError) {
      setLoadSuccess(true);
    }

    setProcessing(false);
  }, [csvFile, xlFile, dealsFile, onDataLoaded, onDealsLoaded]);

  const hasStaged = !!csvFile || !!xlFile || !!dealsFile;
  const showButton = hasStaged || loadSuccess;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FileUpload
          label="Upload Booked Revenue CSV"
          accept=".csv"
          hint="Drag & drop or click — pivot table format"
          onStage={handleCsvStage}
          state={csvState}
          stagedFileName={csvStagedName}
          loadedFileName={csvLoadedName}
          errorMessage={csvError}
        />
        <FileUpload
          label="Upload WoW Analysis Excel"
          accept=".xlsx,.xls"
          hint="Drag & drop or click — sheets: WoW Tracker, Targets"
          onStage={handleXlStage}
          state={xlState}
          stagedFileName={xlStagedName}
          loadedFileName={xlLoadedName}
          errorMessage={xlError}
        />
        <FileUpload
          label="HubSpot Deals Export (.csv)"
          accept=".csv"
          hint="Drag & drop or click — HubSpot deal export"
          onStage={handleDealsStage}
          state={dealsState}
          stagedFileName={dealsStagedName}
          loadedFileName={dealsLoadedName ? `✓ Deals loaded (${dealsCount} deals)` : null}
          errorMessage={dealsError}
        />
      </div>

      {/* Load button */}
      {showButton && (
        <button
          onClick={hasStaged ? handleLoad : () => setLoadSuccess(false)}
          disabled={processing || (!hasStaged && !loadSuccess)}
          className={`w-full mt-4 py-3 rounded-xl text-sm font-bold transition-all ${
            processing
              ? "bg-[#FF4A2D]/60 text-white/70 cursor-wait"
              : loadSuccess && !hasStaged
              ? "bg-green/20 border border-green/40 text-green hover:bg-green/30 cursor-pointer"
              : "bg-[#FF4A2D] text-white hover:bg-[#FF4A2D]/90 active:scale-[0.99]"
          }`}
        >
          {processing ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              Loading...
            </span>
          ) : loadSuccess && !hasStaged ? (
            "✓ Data Loaded — drop new files to refresh"
          ) : (
            "⚡ Load Revenue Data"
          )}
        </button>
      )}
    </div>
  );
}
