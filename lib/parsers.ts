import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { BookedByRepMonth, TargetsByRepMonth } from "./types";

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Map human names and common variations to rep keys */
const REP_NAME_MAP: Record<string, string> = {
  "george leith": "george",
  "george": "george",
  "andy mcnab": "andy",
  "andy": "andy",
  "alex kirkley": "alex",
  "alex": "alex",
};

function resolveRep(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  return REP_NAME_MAP[key] || null;
}

/**
 * Normalize month strings: "January" → "Jan", "jan" → "Jan", "Mar" → "Mar", etc.
 */
function normalizeMonth(raw: string): string | null {
  const trimmed = raw.trim();
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
 * Parse booked revenue CSV.
 * Expected columns: rep (or Rep), month (or Month), amount (or Amount/Revenue)
 * Rep values can be full names ("George Leith") or keys ("george").
 */
export function parseBookedCSV(file: File): Promise<BookedByRepMonth> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const booked: BookedByRepMonth = {};
        for (const row of results.data as Record<string, string>[]) {
          const rawRep = (row.rep || row.Rep || row.REP || "").trim();
          const rep = resolveRep(rawRep);
          if (!rep) continue;

          const rawMonth = (row.month || row.Month || row.MONTH || "").trim();
          const month = normalizeMonth(rawMonth);
          if (!month) continue;

          const amount = parseFloat(
            (row.amount || row.Amount || row.AMOUNT || row.Revenue || row.revenue || "0")
              .replace(/[$,]/g, "")
          );
          if (isNaN(amount)) continue;

          if (!booked[rep]) booked[rep] = {};
          booked[rep][month] = (booked[rep][month] || 0) + amount;
        }

        if (Object.keys(booked).length === 0) {
          reject(new Error("No valid rows found. Expected columns: rep, month, amount"));
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

  // Find the TARGET PLAN section boundaries
  let targetPlanStart = -1;
  let targetPlanEnd = range.e.r;

  // Section headers to detect boundaries (case-insensitive)
  const sectionHeaders = ["board plan", "target plan", "growth plan"];

  for (let r = 0; r <= range.e.r; r++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (!cell) continue;
    const label = String(cell.v || "").trim().toLowerCase();

    if (label.includes("target plan")) {
      targetPlanStart = r;
    } else if (targetPlanStart >= 0) {
      // Check if we've hit the next section (Growth Plan or another header)
      for (const header of sectionHeaders) {
        if (header !== "target plan" && label.includes(header)) {
          targetPlanEnd = r;
          break;
        }
      }
      if (targetPlanEnd < range.e.r) break;
    }
  }

  // If no TARGET PLAN header found, scan entire sheet as fallback
  if (targetPlanStart < 0) {
    targetPlanStart = 0;
  }

  // Find rep rows within the TARGET PLAN section only
  const repRows: { rep: string; row: number }[] = [];

  for (let r = targetPlanStart; r <= targetPlanEnd; r++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (!cell) continue;
    const label = String(cell.v || "").trim().toLowerCase();

    if (label.includes("george leith") && label.includes("ca+v")) {
      repRows.push({ rep: "george", row: r });
    } else if (label.includes("andy mcnab")) {
      repRows.push({ rep: "andy", row: r });
    } else if (label.includes("alex kirkley")) {
      repRows.push({ rep: "alex", row: r });
    }
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
