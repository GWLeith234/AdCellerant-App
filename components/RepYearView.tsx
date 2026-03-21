"use client";

import { useState, useRef, useEffect } from "react";

interface RepYearViewProps {
  repKey: string;
  booked: Record<string, number>;  // month → amount
  targets: Record<string, number>; // month → amount
}

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const QUARTERS = [
  { label: "Q1", months: ["Jan", "Feb", "Mar"], range: "Jan — Mar" },
  { label: "Q2", months: ["Apr", "May", "Jun"], range: "Apr — Jun" },
  { label: "Q3", months: ["Jul", "Aug", "Sep"], range: "Jul — Sep" },
  { label: "Q4", months: ["Oct", "Nov", "Dec"], range: "Oct — Dec" },
];

function formatShort(val: number): string {
  if (val === 0) return "—";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function attColor(pct: number): string {
  if (pct >= 80) return "#2ECC8A";
  if (pct >= 50) return "#F5A623";
  return "#FF4A2D";
}

function attPct(booked: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((booked / target) * 100);
}

function formatAtt(pct: number): string {
  if (pct === 0) return "—";
  if (pct < 1 && pct > 0) return `${pct.toFixed(1)}%`;
  return `${pct}%`;
}

export default function RepYearView({ repKey, booked, targets }: RepYearViewProps) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const currentMonthIndex = new Date().getMonth(); // 0-11
  const currentQuarterIndex = Math.floor(currentMonthIndex / 3); // 0-3

  // Quarter open/close state — current quarter open by default
  const [quarterOpen, setQuarterOpen] = useState<boolean[]>(
    QUARTERS.map((_, i) => i === currentQuarterIndex)
  );

  const toggleQuarter = (idx: number) => {
    setQuarterOpen((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  // Measure content height for animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, quarterOpen]);

  // Annual totals
  const annualBooked = ALL_MONTHS.reduce((s, m) => s + (booked[m] || 0), 0);
  const annualTarget = ALL_MONTHS.reduce((s, m) => s + (targets[m] || 0), 0);
  const annualAtt = attPct(annualBooked, annualTarget);
  const annualGap = annualBooked - annualTarget;

  const hasAnyData = annualBooked > 0 || annualTarget > 0;

  return (
    <div style={{ marginTop: 6 }}>
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          background: "#162236",
          border: "1px solid #2A3F5C",
          borderRadius: 6,
          padding: "8px 12px",
          color: "#4FA3D1",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4FA3D1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A3F5C"; }}
      >
        <span>2026 full year view</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Collapsible panel */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: expanded ? contentHeight + 20 : 0,
          transition: "max-height 0.3s ease",
        }}
      >
        <div ref={contentRef} style={{ paddingTop: 8 }}>
          {!hasAnyData ? (
            <div style={{
              background: "#162236",
              border: "1px solid #2A3F5C",
              borderRadius: 6,
              padding: "16px 12px",
              textAlign: "center",
              fontSize: 12,
              color: "#6B7F96",
            }}>
              No revenue data — upload Excel workbook on Admin page
            </div>
          ) : (
            <>
              {/* Quarter sections */}
              {QUARTERS.map((q, qi) => {
                const qBooked = q.months.reduce((s, m) => s + (booked[m] || 0), 0);
                const qTarget = q.months.reduce((s, m) => s + (targets[m] || 0), 0);
                const qAtt = attPct(qBooked, qTarget);
                const isOpen = quarterOpen[qi];

                return (
                  <div key={q.label} style={{ marginBottom: 6 }}>
                    {/* Quarter header */}
                    <button
                      onClick={() => toggleQuarter(qi)}
                      style={{
                        width: "100%",
                        background: "#162236",
                        border: "1px solid #2A3F5C",
                        borderRadius: 6,
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "border-color 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4FA3D1"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A3F5C"; }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#FF4A2D", textTransform: "uppercase" }}>
                        {q.label}
                      </span>
                      <span style={{ fontSize: 10, color: "#6B7F96" }}>·</span>
                      <span style={{ fontSize: 10, color: "#6B7F96" }}>{q.range}</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, color: "#6B7F96" }}>
                        BKD <span style={{ color: "#F0F4F8" }}>{formatShort(qBooked)}</span>
                      </span>
                      <span style={{ fontSize: 11, color: "#6B7F96", marginLeft: 8 }}>
                        TGT <span style={{ color: "#F0F4F8" }}>{formatShort(qTarget)}</span>
                      </span>
                      <span style={{ fontSize: 11, color: "#6B7F96", marginLeft: 8 }}>
                        ATT <span style={{ color: qTarget > 0 ? attColor(qAtt) : "#6B7F96", fontWeight: 600 }}>
                          {formatAtt(qAtt)}
                        </span>
                      </span>
                      <span style={{ fontSize: 10, color: "#6B7F96", marginLeft: 6 }}>
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>

                    {/* Month cards */}
                    {isOpen && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 6 }}>
                        {q.months.map((m) => {
                          const mi = ALL_MONTHS.indexOf(m);
                          const isPast = mi < currentMonthIndex;
                          const isCurrent = mi === currentMonthIndex;
                          const mBkd = booked[m] || 0;
                          const mTgt = targets[m] || 0;
                          const mAtt = attPct(mBkd, mTgt);

                          const borderLeftColor = isCurrent ? "#FF4A2D" : isPast ? "#2ECC8A" : "#2A3F5C";
                          const bookedColor = isCurrent ? "#FF4A2D" : isPast ? "#2ECC8A" : "#6B7F96";

                          return (
                            <div
                              key={m}
                              style={{
                                background: "#1C2F4A",
                                borderRadius: 6,
                                padding: 10,
                                borderLeft: `3px solid ${borderLeftColor}`,
                              }}
                            >
                              {/* Month name + current badge */}
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                                <span style={{ fontSize: 11, color: "#F0F4F8", fontWeight: 500 }}>{m}</span>
                                {isCurrent && (
                                  <span style={{
                                    fontSize: 8,
                                    background: "rgba(255,74,45,0.2)",
                                    color: "#FF4A2D",
                                    borderRadius: 10,
                                    padding: "1px 6px",
                                    fontWeight: 600,
                                  }}>
                                    current
                                  </span>
                                )}
                              </div>

                              {/* Data rows */}
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                <span style={{ fontSize: 10, color: "#6B7F96" }}>Booked</span>
                                <span style={{ fontSize: 10, color: bookedColor, fontWeight: 500 }}>{formatShort(mBkd)}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                <span style={{ fontSize: 10, color: "#6B7F96" }}>Target</span>
                                <span style={{ fontSize: 10, color: "#F0F4F8", fontWeight: 500 }}>{formatShort(mTgt)}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 10, color: "#6B7F96" }}>Attainment</span>
                                <span style={{ fontSize: 10, color: mTgt > 0 ? attColor(mAtt) : "#6B7F96", fontWeight: 500 }}>
                                  {formatAtt(mAtt)}
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div style={{ height: 4, background: "#2A3F5C", borderRadius: 2, overflow: "hidden" }}>
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${Math.min(mAtt, 100)}%`,
                                    background: mTgt > 0 ? attColor(mAtt) : "#2A3F5C",
                                    borderRadius: 2,
                                    transition: "width 0.3s ease",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Annual summary bar */}
              <div style={{
                background: "#162236",
                border: "1px solid #2A3F5C",
                borderRadius: 6,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 2,
              }}>
                <span style={{ fontSize: 11, color: "#FF4A2D", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                  2026 Annual
                </span>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "#6B7F96" }}>
                    Booked <span style={{ fontSize: 12, fontWeight: 500, color: "#FF4A2D" }}>{formatShort(annualBooked)}</span>
                  </span>
                  <span style={{ fontSize: 10, color: "#6B7F96" }}>
                    Target <span style={{ fontSize: 12, fontWeight: 500, color: "#F0F4F8" }}>{formatShort(annualTarget)}</span>
                  </span>
                  <span style={{ fontSize: 10, color: "#6B7F96" }}>
                    Attainment{" "}
                    <span style={{ fontSize: 12, fontWeight: 500, color: annualTarget > 0 ? attColor(annualAtt) : "#6B7F96" }}>
                      {formatAtt(annualAtt)}
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: "#6B7F96" }}>
                    Gap{" "}
                    <span style={{ fontSize: 12, fontWeight: 500, color: annualGap >= 0 ? "#2ECC8A" : "#FF4A2D" }}>
                      {formatShort(annualGap)}
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
