import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { BookedByRepMonth, TargetsByRepMonth } from "./types";
import type { ParsedDeal } from "./hubspot";

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Partners assigned to Andy McNab (UK revenue line) */
const ANDY_PARTNERS = [
  "ams",
  "beettoo",
  "convergence digital - uk",
  "innocean",
];

function partnerToRep(partnerName: string): string {
  // Normalize: trim, lowercase, collapse whitespace
  const key = partnerName.trim().toLowerCase().replace(/\s+/g, " ");
  return ANDY_PARTNERS.includes(key) ? "andy" : "george";
}

/**
 * Normalize month strings: "January" → "Jan", "jan" → "Jan", "Mar" → "Mar", etc.
 * Also handles YYYY-MM format: "2026-01" → "Jan", "2026-03" → "Mar".
 */
function normalizeMonth(raw: string): string | null {
  const trimmed = raw.trim();

  // Handle YYYY-MM format (e.g. "2026-01" → "Jan")
  const ymd = trimmed.match(/^\d{4}-(\d{2})$/);
  if (ymd) {
    const monthIdx = parseInt(ymd[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) return ALL_MONTHS[monthIdx];
    return null;
  }

  // Try matching against full and short month names
  for (const m of ALL_MONTHS) {
    if (trimmed.toLowerCase() === m.toLowerCase()) return m;
    // Match full month name (e.g. "January" → "Jan")
    const fullMonth = new Date(`${m} 1, 2000`).toLocaleString("en-US", { month: "long" });
    if (trimmed.toLowerCase() === fullMonth.toLowerCase()) return m;
  }
  return null;
}

/**
 * Parse booked revenue CSV (pivot table format).
 *
 * Row 1: "Billing Start Date", then month columns (2026-01, 2026-02, ...)
 * Row 2: "Partner Name", then "Total Revenue" repeated
 * Rows 3+: Partner name in col A, dollar amounts per month
 * Last row (totals with empty partner name) is skipped.
 *
 * Partners are assigned to reps:
 *   AMS, Beettoo, Convergence Digital - UK, Innocean → andy
 *   All others → george
 */
export function parseBookedCSV(file: File): Promise<BookedByRepMonth> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete(results) {
        const rows = results.data as string[][];
        if (rows.length < 3) {
          reject(new Error("CSV too short — expected header row, label row, then data rows"));
          return;
        }

        // Row 0 = month headers: ["Billing Start Date", "2026-01", "2026-02", ...]
        const headerRow = rows[0];

        // Build month map: column index → month short name
        const monthByCol: Record<number, string> = {};
        for (let c = 1; c < headerRow.length; c++) {
          const month = normalizeMonth(headerRow[c] || "");
          if (month) monthByCol[c] = month;
        }

        if (Object.keys(monthByCol).length === 0) {
          reject(new Error("No valid month columns found in header row"));
          return;
        }

        // Skip row 1 (label row with "Partner Name" / "Total Revenue")
        // Process rows 2+ as data
        const booked: BookedByRepMonth = {};

        for (let r = 2; r < rows.length; r++) {
          const row = rows[r];
          const partnerName = (row[0] || "").trim();

          // Skip empty partner name (totals row) or blank rows
          if (!partnerName) continue;

          const rep = partnerToRep(partnerName);

          for (const [colStr, month] of Object.entries(monthByCol)) {
            const col = parseInt(colStr, 10);
            const rawVal = (row[col] || "").replace(/[$,]/g, "").trim();
            const amount = rawVal ? parseFloat(rawVal) : 0;
            if (isNaN(amount) || amount === 0) continue;

            if (!booked[rep]) booked[rep] = {};
            booked[rep][month] = (booked[rep][month] || 0) + amount;
          }
        }

        if (Object.keys(booked).length === 0) {
          reject(new Error("No valid partner revenue data found in CSV"));
          return;
        }

        resolve(booked);
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}

/**
 * Parse Excel workbook with "Targets" and "WoW Tracker" sheets.
 */
export function parseExcelWorkbook(file: File): Promise<{
  booked: BookedByRepMonth;
  targets: TargetsByRepMonth;
  sheetNames: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const booked = parseDealLogSheet(workbook);
        const targets = parseTargetsSheet(workbook);
        const sheetNames = workbook.SheetNames;

        resolve({ booked, targets, sheetNames });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Excel parse error"));
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}

/** Map rep names from Deal Log to rep keys */
const DEAL_LOG_REP_MAP: Record<string, string> = {
  "george leith": "george",
  "andy mcnab": "andy",
  "alex kirkley": "alex",
};

/**
 * Parse "Deal Log" sheet for per-rep monthly booked revenue.
 *
 * Layout (1-indexed):
 *   Row 3 = headers
 *   Rows 4-109 = data rows
 *   Col A(0) = Date Entered
 *   Col B(1) = Week #
 *   Col C(2) = Month (text: "Jan", "Feb", "Mar", etc)
 *   Col D(3) = Rep Name ("George Leith", "Andy McNab")
 *   Col E(4) = Client Name
 *   Col F(5) = Revenue Line
 *   Col G(6) = Pipeline Stage ("Booked", "Forecast", etc)
 *   Col H(7) = Probability %
 *   Col I(8) = Total Deal Value ← KEY COLUMN
 *
 * Only rows where Pipeline Stage (col G) = "Booked" are included.
 * Sums Total Deal Value (col I) grouped by rep + month.
 */
function parseDealLogSheet(workbook: XLSX.WorkBook): BookedByRepMonth {
  const booked: BookedByRepMonth = {};
  const sheet = workbook.Sheets["Deal Log"];
  if (!sheet) return booked;

  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

  // Data rows start at row index 3 (1-indexed row 4)
  for (let r = 3; r <= range.e.r; r++) {
    // Col C (2) = Month
    const monthCell = sheet[XLSX.utils.encode_cell({ r, c: 2 })];
    if (!monthCell) continue;
    const monthRaw = String(monthCell.v || "").trim();
    const month = normalizeMonth(monthRaw);
    if (!month) continue;

    // Col D (3) = Rep Name
    const repCell = sheet[XLSX.utils.encode_cell({ r, c: 3 })];
    if (!repCell) continue;
    const repName = String(repCell.v || "").trim().toLowerCase();
    const rep = DEAL_LOG_REP_MAP[repName];
    if (!rep) continue;

    // Col G (6) = Pipeline Stage — only include "Booked"
    const stageCell = sheet[XLSX.utils.encode_cell({ r, c: 6 })];
    if (!stageCell) continue;
    const stage = String(stageCell.v || "").trim().toLowerCase();
    if (stage !== "booked") continue;

    // Col I (8) = Total Deal Value
    const valCell = sheet[XLSX.utils.encode_cell({ r, c: 8 })];
    if (!valCell) continue;
    const amount = typeof valCell.v === "number"
      ? valCell.v
      : parseFloat(String(valCell.v).replace(/[$,]/g, ""));
    if (isNaN(amount)) continue;

    if (!booked[rep]) booked[rep] = {};
    booked[rep][month] = (booked[rep][month] || 0) + amount;
  }

  return booked;
}

/**
 * Parse "Targets" sheet for monthly targets per rep.
 *
 * TARGET PLAN section (1-indexed rows):
 *   Row 10 = headers (Jan, Feb, Mar... in cols B-M)
 *   Row 13 = CA+V (George's target)
 *   Row 14 = UK (Andy's target)
 *
 * Columns: B(1)=Jan, C(2)=Feb, D(3)=Mar, E(4)=Apr ... M(12)=Dec
 *
 * Values are treated as monthly (not cumulative) based on QA validation.
 *
 * Falls back to label-based scanning if fixed rows don't contain expected data.
 */
function parseTargetsSheet(workbook: XLSX.WorkBook): TargetsByRepMonth {
  const targets: TargetsByRepMonth = {};
  const sheet = workbook.Sheets["Targets"];
  if (!sheet) return targets;

  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

  // Helper: read a row of monthly values from cols B-M (indices 1-12)
  function readMonthlyRow(row: number): Record<string, number> {
    const monthly: Record<string, number> = {};
    for (let c = 1; c <= 12 && c <= range.e.c; c++) {
      const month = ALL_MONTHS[c - 1];
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c })];
      if (!cell) continue;
      const val = typeof cell.v === "number"
        ? cell.v
        : parseFloat(String(cell.v).replace(/[$,]/g, ""));
      if (!isNaN(val) && val > 0) {
        monthly[month] = val;
      }
    }
    return monthly;
  }

  // Try fixed rows first (0-indexed: row 12 = 1-indexed row 13 = CA+V, row 13 = UK)
  const georgeRow = readMonthlyRow(12);
  const andyRow = readMonthlyRow(13);

  if (Object.keys(georgeRow).length > 0) {
    targets["george"] = georgeRow;
  }
  if (Object.keys(andyRow).length > 0) {
    targets["andy"] = andyRow;
  }

  // If fixed rows didn't work, fall back to label-based scanning
  if (Object.keys(targets).length === 0) {
    const repOccurrences: Record<string, number[]> = { george: [], andy: [], alex: [] };

    for (let r = 0; r <= range.e.r; r++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
      if (!cell) continue;
      const label = String(cell.v || "").trim().toLowerCase();

      if (label.includes("george leith") && label.includes("ca+v")) {
        repOccurrences.george.push(r);
      } else if (label.includes("andy mcnab")) {
        repOccurrences.andy.push(r);
      } else if (label.includes("alex kirkley")) {
        repOccurrences.alex.push(r);
      }
    }

    for (const [rep, rows] of Object.entries(repOccurrences)) {
      if (rows.length === 0) continue;
      const targetRow = rows.length >= 2 ? rows[1] : rows[0];
      const monthly = readMonthlyRow(targetRow);
      if (Object.keys(monthly).length > 0) {
        targets[rep] = monthly;
      }
    }
  }

  return targets;
}

/* ── HubSpot Deal Export CSV Parser ──────────────────── */

const STAGE_MAP: Record<string, { category: string; label: string; stageClass: string }> = {
  appointmentscheduled: { category: "leads", label: "Qualification", stageClass: "stage-lead" },
  qualifiedtobuy: { category: "leads", label: "Needs Analysis", stageClass: "stage-lead" },
  presentationscheduled: { category: "prop", label: "Proposal", stageClass: "stage-prop" },
  decisionmakerboughtin: { category: "neg", label: "Negotiation", stageClass: "stage-neg" },
  closedwon: { category: "cw", label: "Closed Won", stageClass: "stage-cw" },
  closedlost: { category: "cl", label: "Closed Lost", stageClass: "stage-cl" },
};

const DEAL_OWNER_MAP: Record<string, string> = {
  "78947458": "george",
  "80955316": "andy",
  "83471854": "alex",
};

/** Map owner names directly to rep keys (bypasses ID lookup) */
const OWNER_NAME_TO_REP: Record<string, string> = {
  "george leith": "george",
  "andy mcnab": "andy",
  "alex kirkley": "alex",
};

/** Map human-readable owner names to owner IDs */
const OWNER_NAME_TO_ID: Record<string, string> = {
  "george leith": "78947458",
  "andy mcnab": "80955316",
  "alex kirkley": "83471854",
};

/** Map readable stage names to internal stage keys */
const STAGE_NAME_TO_KEY: Record<string, string> = {
  "qualification": "appointmentscheduled",
  "needs analysis": "qualifiedtobuy",
  "proposal": "presentationscheduled",
  "negotiation": "decisionmakerboughtin",
  "closed won": "closedwon",
  "closed lost": "closedlost",
};

function formatValShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

/**
 * Find a column value by trying multiple possible header names.
 * Returns the first match found (case-insensitive, whitespace-normalized).
 */
function findCol(row: Record<string, string>, ...candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find(
      (k) => k.trim().toLowerCase().replace(/[\s_]+/g, "") === c.toLowerCase().replace(/[\s_]+/g, "")
    );
    if (key && row[key] !== undefined) return row[key].trim();
  }
  return "";
}

/**
 * Parse a HubSpot deals export CSV into ParsedDeal[].
 *
 * Accepts standard HubSpot export with columns:
 *   Deal Name, Deal Stage, Amount, Close Date, HubSpot Owner ID,
 *   Record ID / Deal ID, Associated Company, etc.
 *
 * Skips rows with missing required fields or unrecognized owner IDs.
 */
export function parseHubSpotDealsCSV(file: File): Promise<{ deals: ParsedDeal[]; totalRows: number }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows = results.data as Record<string, string>[];
        if (rows.length === 0) {
          reject(new Error("CSV is empty — no deals found"));
          return;
        }

        const totalRows = rows.length;
        const deals: ParsedDeal[] = [];

        for (const row of rows) {
          try {
            const name = findCol(row, "DealName", "Deal Name", "Name");
            if (!name) continue; // skip rows without a deal name

            // Stage: try readable name mapping first, then raw key
            const stageStr = findCol(row, "DealStage", "Deal Stage", "Stage", "Pipeline Stage");
            const stageKey = STAGE_NAME_TO_KEY[stageStr.toLowerCase()] ||
              stageStr.toLowerCase().replace(/[^a-z0-9]/g, "");
            const stageInfo = STAGE_MAP[stageKey] || {
              category: "leads",
              label: stageStr || "Unknown",
              stageClass: "stage-lead",
            };

            const amountRaw = findCol(row, "Amount", "Deal Amount", "DealAmount");
            const amount = amountRaw ? parseFloat(amountRaw.replace(/[$,]/g, "")) : 0;
            const val = isNaN(amount) ? 0 : amount;

            // Filter: exclude $0 Closed Lost deals (dead leads)
            if (val === 0 && stageKey === "closedlost") continue;

            const closeDateRaw = findCol(row, "CloseDate", "Close Date", "Close date");
            let closeDate = closeDateRaw;
            if (closeDateRaw) {
              const parsed = new Date(closeDateRaw);
              if (!isNaN(parsed.getTime())) closeDate = parsed.toISOString();
            }

            // Owner: prefer name-based resolution (more reliable in CSV exports)
            // HubSpot CSV "HubSpot Owner Id" column can contain portal owner, not deal owner
            const ownerName = findCol(row, "Deal owner", "Dealowner", "Deal Owner");
            const ownerId = findCol(row, "HubSpotOwnerID", "HubSpot Owner ID", "hubspot_owner_id");

            const dealId = findCol(row, "RecordID", "Record ID", "DealID", "Deal ID", "hs_object_id");
            const company = findCol(
              row,
              "Associated Company (Primary)",
              "AssociatedCompany",
              "Associated Company",
              "Company",
              "Company Name",
              "CompanyName"
            );
            const persona = findCol(row, "Persona", "Deal Persona", "persona");
            const createDate = findCol(row, "CreateDate", "Create Date", "Create date", "Created");

            // Determine rep: name first → ID fallback → company fallback
            let rep = "";

            // 1. Owner name → direct rep mapping (most reliable for CSV)
            if (ownerName) {
              rep = OWNER_NAME_TO_REP[ownerName.trim().toLowerCase()] || "";
            }

            // 2. Fall back to owner ID mapping
            if (!rep && ownerId) {
              rep = DEAL_OWNER_MAP[ownerId.trim()] || "";
            }

            // 3. Fall back to company name detection
            if (!rep && company.toLowerCase().includes("vendasta")) {
              rep = "vendasta";
            }
            if (!rep) continue; // skip deals with unrecognized owners

            const stageAge = createDate ? daysSince(createDate) : 0;

            const deal: ParsedDeal = {
              id: dealId || `csv-${deals.length}`,
              hsId: dealId || "",
              name,
              sub: company || "",
              val,
              valShort: formatValShort(val),
              rep,
              stage: stageInfo.label,
              stageClass: stageInfo.stageClass,
              cat: stageInfo.category,
              closeDate: closeDate || "",
              stageAge,
              persona: persona || "",
              revenueLine: "",
              meddic: {
                metrics: "gap",
                econBuyer: "gap",
                decisionCriteria: "gap",
                decisionProcess: "gap",
                identifyPain: "gap",
                champion: "gap",
              },
              contacts: [],
              nda: "Not sent",
              msa: "Not sent",
              sow: "Not sent",
              credit: "Not sent",
              bizdev: "Not sent",
              partner: "Not sent",
              hasResearch: false,
              researchNotes: "",
              meddicNotes: {
                metrics: "",
                econBuyer: "",
                decisionCriteria: "",
                decisionProcess: "",
                identifyPain: "",
                champion: "",
              },
              action1: "Follow Up",
              action2: "Update Stage",
              description: "",
              domain: null,
            };

            deals.push(deal);
          } catch {
            // Skip malformed rows
            continue;
          }
        }

        if (deals.length === 0) {
          reject(new Error("No valid deals found in CSV — check column headers"));
          return;
        }

        // Debug: log deal owner distribution
        const repCounts: Record<string, number> = {};
        for (const d of deals) {
          repCounts[d.rep] = (repCounts[d.rep] || 0) + 1;
        }
        console.log("DEAL OWNER DEBUG:", {
          totalParsed: deals.length,
          totalRows,
          byRep: repCounts,
          sample: deals.slice(0, 5).map((d) => ({
            name: d.name,
            rep: d.rep,
            val: d.val,
          })),
        });

        resolve({ deals, totalRows });
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}
