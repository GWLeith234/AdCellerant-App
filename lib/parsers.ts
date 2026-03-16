import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { BookedByRepMonth, TargetsByRepMonth } from "./types";

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Partners assigned to Andy McNab (UK revenue line) */
const ANDY_PARTNERS = [
  "ams",
  "beettoo",
  "convergence digital",
  "innocean",
];

function partnerToRep(partnerName: string): string {
  // Normalize: trim, lowercase, collapse whitespace
  const key = partnerName.trim().toLowerCase().replace(/\s+/g, " ");
  return ANDY_PARTNERS.some((p) => key === p || key.startsWith(p)) ? "andy" : "george";
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
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const booked = parseWoWTrackerSheet(workbook);
        const targets = parseTargetsSheet(workbook);

        resolve({ booked, targets });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Excel parse error"));
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse "WoW Tracker" sheet for booked revenue.
 *
 * Layout:
 *   Row 1 = headers (weeks or dates), last column with data = most recent week
 *   Rows 4-15 = months (Jan-Dec), col A = month label, values in data columns
 *
 * We read the LAST data column for each month row to get most-recent booked amounts.
 * This gives us aggregate booked data (not per-rep). We'll store under a special
 * "_wow" key, but the main per-rep booked data comes from the CSV upload.
 */
function parseWoWTrackerSheet(workbook: XLSX.WorkBook): BookedByRepMonth {
  const booked: BookedByRepMonth = {};
  const sheet = workbook.Sheets["WoW Tracker"];
  if (!sheet) return booked;

  // Get sheet range
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

  // Find last data column (last column in row 1 with data)
  let lastDataCol = range.e.c;
  while (lastDataCol > 0) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: lastDataCol })];
    if (cell && cell.v !== undefined && cell.v !== "") break;
    lastDataCol--;
  }

  // Rows 3-14 (0-indexed) = months Jan-Dec (rows 4-15 in 1-indexed)
  for (let rowIdx = 3; rowIdx <= 14 && rowIdx <= range.e.r; rowIdx++) {
    // Column A = month label
    const labelCell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })];
    if (!labelCell) continue;
    const monthLabel = String(labelCell.v || "").trim();
    const month = normalizeMonth(monthLabel);
    if (!month) continue;

    // Read last data column value
    const valCell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: lastDataCol })];
    if (!valCell) continue;
    const amount = typeof valCell.v === "number" ? valCell.v : parseFloat(String(valCell.v).replace(/[$,]/g, ""));
    if (isNaN(amount) || amount === 0) continue;

    // Store as team-level booked (will be merged if CSV also provides per-rep data)
    if (!booked["_wow_total"]) booked["_wow_total"] = {};
    booked["_wow_total"][month] = amount;
  }

  return booked;
}

/**
 * Parse "Targets" sheet for monthly targets per rep.
 *
 * Layout: Raw cell grid with labeled sections.
 * We look for specific row labels in column A within the TARGET PLAN section
 * (NOT Board Plan, NOT Growth Plan — the middle section):
 *   - "George Leith — CA+V Total"
 *   - "Andy McNab — UK..."
 *   - "Alex Kirkley — UK..."
 *
 * Columns B-M (indices 1-12) = Jan-Dec target amounts.
 */
function parseTargetsSheet(workbook: XLSX.WorkBook): TargetsByRepMonth {
  const targets: TargetsByRepMonth = {};
  const sheet = workbook.Sheets["Targets"];
  if (!sheet) return targets;

  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

  // Collect ALL occurrences of each rep across the entire sheet.
  // The sheet has multiple sections (Board Plan, Target Plan, Growth Plan)
  // each containing the same rep names. We want the TARGET PLAN rows,
  // which are the SECOND occurrence of each rep name.
  const repOccurrences: Record<string, number[]> = {
    george: [],
    andy: [],
    alex: [],
  };

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

  // Use the SECOND occurrence (Target Plan) for each rep.
  // Fall back to first occurrence if only one exists.
  const repRows: { rep: string; row: number }[] = [];
  for (const [rep, rows] of Object.entries(repOccurrences)) {
    if (rows.length === 0) continue;
    // Second occurrence = Target Plan; first = Board Plan
    const targetRow = rows.length >= 2 ? rows[1] : rows[0];
    repRows.push({ rep, row: targetRow });
  }

  // Read monthly targets from columns B-M (indices 1-12) for each rep row
  for (const { rep, row } of repRows) {
    targets[rep] = {};

    for (let c = 1; c <= 12; c++) {
      const month = ALL_MONTHS[c - 1];
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c })];
      if (!cell) continue;

      const val = typeof cell.v === "number" ? cell.v : parseFloat(String(cell.v).replace(/[$,]/g, ""));
      if (!isNaN(val) && val > 0) {
        targets[rep][month] = val;
      }
    }
  }

  return targets;
}
