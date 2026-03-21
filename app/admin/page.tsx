"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Topbar from "@/components/Topbar";
import { useRevenueData } from "@/lib/RevenueDataContext";
import { useDealData } from "@/lib/DealDataContext";
import { REP_CONFIGS } from "@/lib/reps";
import { REP_PHOTOS } from "@/lib/repPhotos";
import { parseBookedCSV, parseExcelWorkbook, parseHubSpotDealsCSV } from "@/lib/parsers";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";

const ALLOWED_EMAILS = [
  "george.leith@adcellerant.com",
  "andy.mcnab@adcellerant.com",
  "alex.kirkley@adcellerant.com",
];

const REP_OWNER_IDS: Record<string, string> = {
  george: "78947458",
  andy: "80955316",
  alex: "83471854",
};

const orb = "var(--font-orbitron), monospace";

const cardStyle: React.CSSProperties = {
  background: "#1C2F4A",
  borderRadius: 8,
  padding: 24,
};

const sectionHeaderStyle: React.CSSProperties = {
  fontFamily: orb,
  fontSize: 13,
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#FF4A2D",
  letterSpacing: 1.5,
  marginBottom: 16,
  margin: 0,
};

function formatShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val === 0) return "—";
  return `$${val.toFixed(0)}`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${month} ${day}, ${time}`;
}

/* ── Drop Zone ────────────────────────────────────────── */

function DropZone({
  accept,
  label,
  onFile,
  loadedInfo,
  acceptLabel,
}: {
  accept: string;
  label: string;
  onFile: (file: File) => void;
  loadedInfo?: string | null;
  acceptLabel?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      style={{
        height: 100,
        border: `2px dashed ${dragOver ? "#4FA3D1" : "#2A3F5C"}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          if (inputRef.current) inputRef.current.value = "";
        }}
        style={{ display: "none" }}
      />
      {loadedInfo ? (
        <span style={{ fontSize: 12, color: "#2ECC8A" }}>{loadedInfo}</span>
      ) : (
        <>
          <span style={{ fontSize: 12, color: "#6B7F96" }}>{label}</span>
          {acceptLabel && (
            <span style={{ fontSize: 10, color: "#4A6380", marginTop: 4 }}>{acceptLabel}</span>
          )}
        </>
      )}
    </div>
  );
}

/* ── Admin Page ───────────────────────────────────────── */

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    loadRevenueData,
    resetRevenueData,
    hasRevenueData,
    bookedByRepMonth,
    targetsByRepMonth,
    dataSource,
    csvUploadedAt,
    excelUploadedAt,
    setCsvUploadedAt,
    setExcelUploadedAt,
  } = useRevenueData();
  const { loadUploadedDeals, resetUploadedDeals, hasUploadedDeals, uploadedDeals } = useDealData();

  // Staged files
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [xlFile, setXlFile] = useState<File | null>(null);

  // Display state
  const [csvLoadedName, setCsvLoadedName] = useState<string | null>(null);
  const [csvDealCount, setCsvDealCount] = useState<number>(0);
  const [xlLoadedName, setXlLoadedName] = useState<string | null>(null);
  const [xlSheetNames, setXlSheetNames] = useState<string[]>([]);

  // Processing
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const userEmail = session?.user?.email?.toLowerCase() || "";
  const isAllowed = ALLOWED_EMAILS.includes(userEmail) || !session;

  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });

  // Diagnostic data
  const diagRows = useMemo(() => {
    return REP_CONFIGS.filter((r) => r.key !== "vendasta").map((config) => {
      const repBooked = bookedByRepMonth[config.key] || {};
      const repTargets = targetsByRepMonth[config.key] || {};
      const mBkd = repBooked[currentMonth] || 0;
      const mTgt = repTargets[currentMonth] || 0;
      const att = mTgt > 0 ? Math.round((mBkd / mTgt) * 100) : 0;
      const q1 = ["Jan", "Feb", "Mar"].reduce((s, m) => s + (repBooked[m] || 0), 0);
      const annualTgt = Object.values(repTargets).reduce((s, v) => s + v, 0);
      return { name: config.name, isRamp: config.isRamp, mBkd, mTgt, att, q1, annualTgt };
    });
  }, [bookedByRepMonth, targetsByRepMonth, currentMonth]);

  // Parse info for diagnostics
  const dealOwnerCounts = useMemo(() => {
    if (!hasUploadedDeals) return 0;
    const owners = new Set(uploadedDeals.map((d) => d.rep));
    return owners.size;
  }, [uploadedDeals, hasUploadedDeals]);

  // Handle process button
  const handleProcess = useCallback(async () => {
    if (!csvFile && !xlFile) return;
    setProcessing(true);
    setProcessError(null);
    setProcessResult(null);

    let booked: BookedByRepMonth | undefined;
    let targets: TargetsByRepMonth | undefined;
    let hadError = false;
    let dealCount = 0;
    let sheetCount = 0;
    let sheetNames: string[] = [];

    // Process HubSpot CSV (deals)
    if (csvFile) {
      try {
        const parsedDeals = await parseHubSpotDealsCSV(csvFile);
        dealCount = parsedDeals.length;
        setCsvLoadedName(csvFile.name);
        setCsvDealCount(dealCount);
        setCsvFile(null);
        setCsvUploadedAt(new Date().toISOString());
        loadUploadedDeals(parsedDeals);

        // Also try to parse as booked CSV
        try {
          booked = await parseBookedCSV(csvFile);
        } catch {
          // Not a booked CSV format, that's fine
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "CSV parse error";
        setProcessError(msg);
        hadError = true;
      }
    }

    // Process Excel
    if (xlFile) {
      try {
        const result = await parseExcelWorkbook(xlFile);
        if (booked) {
          for (const [rep, months] of Object.entries(result.booked)) {
            booked[rep] = { ...(booked[rep] || {}), ...months };
          }
        } else {
          booked = result.booked;
        }
        targets = result.targets;
        sheetNames = result.sheetNames;
        sheetCount = sheetNames.length;
        setXlLoadedName(xlFile.name);
        setXlSheetNames(sheetNames);
        setXlFile(null);
        setExcelUploadedAt(new Date().toISOString());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Excel parse error";
        setProcessError((prev) => prev ? `${prev}; ${msg}` : msg);
        hadError = true;
      }
    }

    if (booked || targets) {
      loadRevenueData({ booked, targets });
    }

    if (!hadError) {
      const parts: string[] = [];
      if (dealCount > 0) parts.push(`${dealCount} deals`);
      if (sheetCount > 0) parts.push(`${sheetCount} sheets processed`);
      setProcessResult(`Data loaded — ${parts.join(", ")}`);
    }

    // Warning for partial upload
    if (!csvFile && xlFile && !hadError) {
      setProcessResult((prev) => prev + " | Only Revenue Excel uploaded — partial data");
    } else if (csvFile && !xlFile && !hadError) {
      setProcessResult((prev) => prev + " | Only HubSpot CSV uploaded — partial data");
    }

    setProcessing(false);
  }, [csvFile, xlFile, loadRevenueData, loadUploadedDeals, setCsvUploadedAt, setExcelUploadedAt]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0D1B2E" }}>
        <Topbar />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
          <p style={{ color: "#6B7F96", fontSize: 14 }}>Loading...</p>
        </main>
      </div>
    );
  }

  if (status === "unauthenticated") return null;
  if (session && !isAllowed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D1B2E" }}>
        <Topbar />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
          <p style={{ color: "#FF4A2D", fontSize: 14 }}>Access denied. Admin only.</p>
        </main>
      </div>
    );
  }

  const hasStaged = !!csvFile || !!xlFile;

  return (
    <div style={{ minHeight: "100vh", background: "#0D1B2E" }}>
      <Topbar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Page header */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#F0F4F8", margin: 0 }}>Admin</h1>
          <p style={{ fontSize: 13, color: "#6B7F96", margin: "4px 0 0" }}>
            Data management, connections, and team settings
          </p>
        </div>

        {/* ═══ SECTION 1 — HUBSPOT DATA ═══ */}
        <section>
          <div style={cardStyle}>
            <h2 style={sectionHeaderStyle}>HUBSPOT DATA</h2>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {/* LEFT — Connection status */}
              <div style={{ flex: "1 1 240px", minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ECC8A" }} />
                  <span style={{ fontSize: 13, color: "#2ECC8A" }}>Connected via CSV</span>
                </div>
                <div style={{ fontSize: 12, color: "#6B7F96", fontFamily: "monospace", marginBottom: 16 }}>
                  Portal ID: 47345959
                </div>

                {/* Future API connect button */}
                <button
                  disabled
                  style={{
                    background: "transparent",
                    border: "1px solid #2A3F5C",
                    color: "#6B7F96",
                    fontSize: 12,
                    padding: "6px 14px",
                    borderRadius: 6,
                    cursor: "not-allowed",
                    opacity: 0.4,
                  }}
                >
                  Connect HubSpot API
                </button>
                <p style={{ fontSize: 10, color: "#4A6380", marginTop: 6 }}>
                  Coming soon — direct API connection
                </p>
              </div>

              {/* RIGHT — CSV Upload */}
              <div style={{ flex: "1 1 300px", minWidth: 280 }}>
                <p style={{ fontSize: 13, color: "#F0F4F8", fontWeight: 500, margin: "0 0 4px" }}>
                  HubSpot Deals Export
                </p>
                <p style={{ fontSize: 11, color: "#6B7F96", margin: "0 0 10px" }}>
                  Export from HubSpot &rarr; Contacts &rarr; Deals &rarr; Export
                </p>

                <DropZone
                  accept=".csv"
                  label="Drop CSV here or click to browse"
                  acceptLabel=".csv files only"
                  onFile={(file) => setCsvFile(file)}
                  loadedInfo={
                    csvLoadedName
                      ? `✓ ${csvLoadedName} — ${csvDealCount} deals loaded`
                      : csvFile
                      ? `📎 ${csvFile.name} (staged)`
                      : null
                  }
                />

                <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
                  <span>
                    <span style={{ color: "#6B7F96" }}>Last upload: </span>
                    <span style={{ color: csvUploadedAt ? "#F0F4F8" : "#F5A623" }}>
                      {formatTimestamp(csvUploadedAt)}
                    </span>
                  </span>
                  <span>
                    <span style={{ color: "#6B7F96" }}>Deals loaded: </span>
                    <span style={{ color: "#F0F4F8" }}>
                      {hasUploadedDeals ? uploadedDeals.length : "—"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 2 — REVENUE & TARGETS ═══ */}
        <section>
          <div style={cardStyle}>
            <h2 style={sectionHeaderStyle}>REVENUE &amp; TARGETS</h2>
            <p style={{ fontSize: 13, color: "#F0F4F8", fontWeight: 500, margin: "0 0 4px" }}>
              International Business Unit WoW Analysis
            </p>
            <p style={{ fontSize: 11, color: "#6B7F96", margin: "0 0 10px" }}>
              Excel workbook with Targets, Deal Log, Pipeline, Forecast sheets
            </p>

            <DropZone
              accept=".xlsx,.xls"
              label="Drop Excel file here or click to browse"
              acceptLabel=".xlsx, .xls files"
              onFile={(file) => setXlFile(file)}
              loadedInfo={
                xlLoadedName
                  ? `✓ ${xlLoadedName} — sheets detected: ${xlSheetNames.join(", ")}`
                  : xlFile
                  ? `📎 ${xlFile.name} (staged)`
                  : null
              }
            />

            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
              <span>
                <span style={{ color: "#6B7F96" }}>Last upload: </span>
                <span style={{ color: excelUploadedAt ? "#F0F4F8" : "#F5A623" }}>
                  {formatTimestamp(excelUploadedAt)}
                </span>
              </span>
              {xlSheetNames.length > 0 && (
                <span>
                  <span style={{ color: "#6B7F96" }}>Sheets: </span>
                  <span style={{ color: "#F0F4F8" }}>{xlSheetNames.join(", ")}</span>
                </span>
              )}
            </div>

            {/* ⚡ Process Revenue Data button */}
            <button
              onClick={handleProcess}
              disabled={processing || !hasStaged}
              style={{
                width: "100%",
                marginTop: 16,
                padding: "12px 32px",
                borderRadius: 6,
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: processing || !hasStaged ? "not-allowed" : "pointer",
                color: "#fff",
                background: processing
                  ? "rgba(255,74,45,0.6)"
                  : !hasStaged
                  ? "rgba(255,74,45,0.3)"
                  : "#FF4A2D",
                transition: "background 0.2s",
              }}
            >
              {processing ? "Processing..." : "⚡ Process Revenue Data"}
            </button>

            {/* Result / error messages */}
            {processResult && (
              <p style={{ fontSize: 12, color: "#2ECC8A", marginTop: 10 }}>
                ✓ {processResult}
              </p>
            )}
            {processError && (
              <p style={{ fontSize: 12, color: "#FF4A2D", marginTop: 10 }}>
                ✕ {processError}
              </p>
            )}

            {/* Reset button */}
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => {
                  resetRevenueData();
                  resetUploadedDeals();
                  setCsvLoadedName(null);
                  setCsvDealCount(0);
                  setXlLoadedName(null);
                  setXlSheetNames([]);
                  setProcessResult(null);
                  setProcessError(null);
                }}
                style={{
                  background: "none",
                  border: "1px solid #2A3F5C",
                  color: "#6B7F96",
                  fontSize: 11,
                  padding: "4px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Reset to mock data
              </button>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3 — REVENUE DIAGNOSTICS ═══ */}
        <section>
          <div style={cardStyle}>
            <h2 style={sectionHeaderStyle}>REVENUE DIAGNOSTICS</h2>
            {hasRevenueData ? (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#162236" }}>
                        {["Rep", `${currentMonth} BKD`, `${currentMonth} TGT`, "ATT%", "Q1 BKD", "Annual TGT"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "8px 10px",
                              fontSize: 10,
                              textTransform: "uppercase",
                              color: "#6B7F96",
                              fontWeight: 600,
                              borderBottom: "1px solid #2A3F5C",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {diagRows.map((row) => (
                        <tr key={row.name} style={{ borderBottom: "1px solid #2A3F5C" }}>
                          <td style={{ padding: "8px 10px", color: "#F0F4F8", fontSize: 13, fontWeight: 600 }}>
                            {row.name}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#F0F4F8", fontSize: 13, fontFamily: "monospace" }}>
                            {row.isRamp ? "—" : formatShort(row.mBkd)}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#F0F4F8", fontSize: 13, fontFamily: "monospace" }}>
                            {row.isRamp ? "—" : formatShort(row.mTgt)}
                          </td>
                          <td
                            style={{
                              padding: "8px 10px",
                              fontSize: 13,
                              fontFamily: "monospace",
                              fontWeight: 600,
                              color: row.isRamp
                                ? "#6B7F96"
                                : row.att >= 80
                                ? "#2ECC8A"
                                : row.att >= 50
                                ? "#F5A623"
                                : "#FF4A2D",
                            }}
                          >
                            {row.isRamp ? "Ramp" : row.mTgt > 0 ? `${row.att}%` : "—"}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#F0F4F8", fontSize: 13, fontFamily: "monospace" }}>
                            {row.isRamp ? "—" : formatShort(row.q1)}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#F0F4F8", fontSize: 13, fontFamily: "monospace" }}>
                            {row.isRamp ? "—" : formatShort(row.annualTgt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Raw parsing info */}
                <div style={{ marginTop: 16, fontFamily: "monospace", fontSize: 11, color: "#6B7F96" }}>
                  {hasUploadedDeals && (
                    <p style={{ margin: "2px 0" }}>
                      CSV parsed: {uploadedDeals.length} deals across {dealOwnerCounts} owners
                    </p>
                  )}
                  {xlSheetNames.length > 0 && (
                    <p style={{ margin: "2px 0" }}>
                      Excel parsed: {xlSheetNames.length} sheets — {xlSheetNames.join(", ")}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p style={{ color: "#6B7F96", fontSize: 13 }}>
                Upload and process files to see diagnostics
              </p>
            )}
          </div>
        </section>

        {/* ═══ SECTION 4 — TEAM ═══ */}
        <section>
          <div style={cardStyle}>
            <h2 style={sectionHeaderStyle}>TEAM</h2>
            {REP_CONFIGS.map((config, i) => (
              <div
                key={config.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: i < REP_CONFIGS.length - 1 ? "1px solid #2A3F5C" : "none",
                }}
              >
                {/* Photo */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: config.key === "vendasta" ? "#fff" : "#1C2F4A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {REP_PHOTOS[config.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={REP_PHOTOS[config.key]}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        objectFit: config.key === "vendasta" ? "contain" : "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7F96" }}>
                      {config.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                  )}
                </div>

                {/* Name */}
                <span style={{ fontSize: 14, color: "#F0F4F8", fontWeight: 500, minWidth: 120 }}>
                  {config.name}
                </span>

                {/* Role */}
                <span style={{ fontSize: 12, color: "#6B7F96", flex: 1 }}>
                  {config.key === "alex"
                    ? "Dir Agency Partnerships"
                    : config.role}
                </span>

                {/* Owner ID */}
                <span style={{ fontSize: 11, color: "#6B7F96", fontFamily: "monospace" }}>
                  {REP_OWNER_IDS[config.key] || "—"}
                </span>

                {/* Flag */}
                <span style={{ fontSize: 16 }}>
                  {config.flag === "ca" ? "🇨🇦" : config.flag === "uk" ? "🇬🇧" : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 5 — PIPELINE SETTINGS ═══ */}
        <section>
          <div style={cardStyle}>
            <h2 style={sectionHeaderStyle}>PIPELINE SETTINGS</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <InfoRow label="Whale threshold" value="$250,000" />
              <InfoRow
                label="Pipeline stages"
                value="Qualification → Needs Analysis → Proposal → Negotiation → Closed Won"
              />
              <InfoRow
                label="Stage probabilities"
                value="Qual 25% → NA 25% → Proposal 50% → Negotiation 75% → Forecast 99%"
              />
            </div>

            <p style={{ fontSize: 11, fontStyle: "italic", color: "#6B7F96", marginTop: 16 }}>
              These settings are read-only. Contact George to update.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: "#6B7F96" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#F0F4F8", textAlign: "right" }}>{value}</span>
    </div>
  );
}
