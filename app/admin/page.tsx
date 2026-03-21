"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import Topbar from "@/components/Topbar";
import DataUploadPanel from "@/components/DataUploadPanel";
import { useRevenueData } from "@/lib/RevenueDataContext";
import { useDealData } from "@/lib/DealDataContext";
import { REP_CONFIGS } from "@/lib/reps";
import { REP_PHOTOS } from "@/lib/repPhotos";

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

const sectionHeader: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#FF4A2D",
  letterSpacing: 1,
  marginBottom: 12,
};

const sectionBody: React.CSSProperties = {
  background: "#1C2F4A",
  borderRadius: 8,
  padding: 20,
};

function formatShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val === 0) return "—";
  return `$${val.toFixed(0)}`;
}

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
  } = useRevenueData();
  const { loadUploadedDeals, resetUploadedDeals, hasUploadedDeals } = useDealData();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const userEmail = session?.user?.email?.toLowerCase() || "";
  const isAllowed = ALLOWED_EMAILS.includes(userEmail) || !session;

  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });

  // Revenue debug data
  const debugRows = useMemo(() => {
    return REP_CONFIGS.filter((r) => r.key !== "vendasta").map((config) => {
      const repBooked = bookedByRepMonth[config.key] || {};
      const repTargets = targetsByRepMonth[config.key] || {};
      const mBkd = repBooked[currentMonth] || 0;
      const mTgt = repTargets[currentMonth] || 0;
      const att = mTgt > 0 ? Math.round((mBkd / mTgt) * 100) : 0;
      const q1 = ["Jan", "Feb", "Mar"].reduce((s, m) => s + (repBooked[m] || 0), 0);
      return { name: config.name, mBkd, mTgt, att, q1 };
    });
  }, [bookedByRepMonth, targetsByRepMonth, currentMonth]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0D1B2E" }}>
        <Topbar />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
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
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
          <p style={{ color: "#FF4A2D", fontSize: 14 }}>Access denied. Admin only.</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0D1B2E" }}>
      <Topbar />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F0F4F8", margin: 0 }}>Admin</h1>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "#6B7F96",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ← Dashboard
          </button>
        </div>

        {/* ── DATA UPLOADS ── */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHeader}>DATA UPLOADS</h2>
          <div style={sectionBody}>
            <DataUploadPanel
              onDataLoaded={loadRevenueData}
              onDealsLoaded={loadUploadedDeals}
              hasExistingData={hasRevenueData}
              hasExistingDeals={hasUploadedDeals}
            />
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => { resetRevenueData(); resetUploadedDeals(); }}
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
                🔄 Reset to mock data
              </button>
            </div>
          </div>
        </section>

        {/* ── HUBSPOT ── */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHeader}>HUBSPOT</h2>
          <div style={sectionBody}>
            <InfoRow label="Portal ID" value="47345959" />
            <InfoRow label="Data source" value="CSV upload (manual)" />
          </div>
        </section>

        {/* ── TEAM ── */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHeader}>TEAM</h2>
          <div style={sectionBody}>
            {REP_CONFIGS.map((config, i) => (
              <div
                key={config.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < REP_CONFIGS.length - 1 ? "1px solid #2A3F5C" : "none",
                }}
              >
                {/* Photo */}
                <div
                  style={{
                    width: 32,
                    height: 32,
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
                        width: 32,
                        height: 32,
                        objectFit: config.key === "vendasta" ? "contain" : "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7F96" }}>
                      {config.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                  )}
                </div>
                {/* Info */}
                <span style={{ fontSize: 13, color: "#F0F4F8", fontWeight: 600, minWidth: 140 }}>
                  {config.name}
                </span>
                <span style={{ fontSize: 13, color: "#6B7F96", flex: 1 }}>
                  {config.role}
                </span>
                <span style={{ fontSize: 12, color: "#6B7F96", fontFamily: "monospace" }}>
                  {REP_OWNER_IDS[config.key] || "—"}
                </span>
                <span style={{ fontSize: 14 }}>
                  {config.flag === "ca" ? "🇨🇦" : config.flag === "uk" ? "🇬🇧" : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── REVENUE DEBUG ── */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHeader}>REVENUE DEBUG</h2>
          <div style={sectionBody}>
            {hasRevenueData ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#162236" }}>
                    {["Rep", `${currentMonth} BKD`, `${currentMonth} TGT`, "ATT%", "Q1 BKD"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 10px",
                          fontSize: 11,
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
                  {debugRows.map((row) => (
                    <tr key={row.name} style={{ borderBottom: "1px solid #2A3F5C" }}>
                      <td style={{ padding: "8px 10px", color: "#F0F4F8", fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: "8px 10px", color: "#F0F4F8" }}>{formatShort(row.mBkd)}</td>
                      <td style={{ padding: "8px 10px", color: "#F0F4F8" }}>{formatShort(row.mTgt)}</td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: row.att >= 80 ? "#2ECC8A" : row.att >= 50 ? "#F5A623" : "#FF4A2D",
                          fontWeight: 600,
                        }}
                      >
                        {row.mTgt > 0 ? `${row.att}%` : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#F0F4F8" }}>{formatShort(row.q1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "#6B7F96", fontSize: 13 }}>
                Upload CSV and Excel files to see diagnostics
              </p>
            )}
          </div>
        </section>

        {/* ── SETTINGS ── */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHeader}>SETTINGS</h2>
          <div style={sectionBody}>
            <InfoRow label="Whale threshold" value="$250,000" />
            <InfoRow
              label="Pipeline stages"
              value="Qualification → Needs Analysis → Proposal → Negotiation → Closed Won"
            />
            <InfoRow
              label="Revenue source"
              value={dataSource === "csv" ? "CSV Upload" : dataSource === "live" ? "HubSpot Live" : "Mock Data"}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
      <span style={{ fontSize: 13, color: "#6B7F96" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#F0F4F8" }}>{value}</span>
    </div>
  );
}
