import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { BookedByRepMonth, TargetsByRepMonth } from "./types";

/**
 * Parse booked revenue CSV.
 * Expected columns: rep (or Rep), month (or Month), amount (or Amount/Revenue)
 */
export function parseBookedCSV(file: File): Promise<BookedByRepMonth> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const booked: BookedByRepMonth = {};
        for (const row of results.data as Record<string, string>[]) {
          const rep = (row.rep || row.Rep || row.REP || "").trim().toLowerCase();
          const month = (row.month || row.Month || row.MONTH || "").trim();
          const amount = parseFloat(
            (row.amount || row.Amount || row.AMOUNT || row.Revenue || row.revenue || "0")
              .replace(/[$,]/g, "")
          );

          if (!rep || !month || isNaN(amount)) continue;

          if (!booked[rep]) booked[rep] = {};
          booked[rep][month] = (booked[rep][month] || 0) + amount;
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
 * Parse Excel workbook with WoW Tracker and Targets sheets.
 *
 * WoW Tracker sheet: rows of booked revenue by rep and month.
 * Targets sheet: "Target Plan" rows with monthly targets per rep.
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

function parseWoWTrackerSheet(workbook: XLSX.WorkBook): BookedByRepMonth {
  const booked: BookedByRepMonth = {};
  const sheet = workbook.Sheets["WoW Tracker"];
  if (!sheet) return booked;

  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
    defval: "",
  });

  for (const row of rows) {
    const rep = String(row["Rep"] || row["rep"] || "").trim().toLowerCase();
    if (!rep) continue;

    for (const [key, val] of Object.entries(row)) {
      if (key.toLowerCase() === "rep") continue;
      const amount = typeof val === "number" ? val : parseFloat(String(val).replace(/[$,]/g, ""));
      if (isNaN(amount) || amount === 0) continue;

      if (!booked[rep]) booked[rep] = {};
      booked[rep][key] = (booked[rep][key] || 0) + amount;
    }
  }

  return booked;
}

function parseTargetsSheet(workbook: XLSX.WorkBook): TargetsByRepMonth {
  const targets: TargetsByRepMonth = {};
  const sheet = workbook.Sheets["Targets"];
  if (!sheet) return targets;

  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
    defval: "",
  });

  for (const row of rows) {
    const label = String(row["Label"] || row["label"] || row[""] || "").trim();
    if (!label.toLowerCase().includes("target plan")) continue;

    const rep = String(row["Rep"] || row["rep"] || "").trim().toLowerCase();
    if (!rep) continue;

    for (const [key, val] of Object.entries(row)) {
      const kl = key.toLowerCase();
      if (kl === "rep" || kl === "label" || kl === "") continue;
      const target = typeof val === "number" ? val : parseFloat(String(val).replace(/[$,]/g, ""));
      if (isNaN(target) || target === 0) continue;

      if (!targets[rep]) targets[rep] = {};
      targets[rep][key] = target;
    }
  }

  return targets;
}
