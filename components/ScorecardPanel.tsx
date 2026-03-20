"use client";

import type { RepConfig } from "@/lib/reps";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";

/* ── Constants ─────────────────────────────────────────── */

const orb = "var(--font-orbitron), monospace";

const GEORGE_REVENUE_TARGETS: Record<string, number> = {
  Jan: 8985, Feb: 10553, Mar: 19966,
  Apr: 14703, May: 17535, Jun: 34157,
  Jul: 29962, Aug: 29962, Sep: 29962,
  Oct: 29962, Nov: 29962, Dec: 29960,
};

const GEORGE_REVENUE_BOOKED: Record<string, number> = {
  Jan: 5563, Feb: 12161, Mar: 15146, Apr: 12731,
};

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── Helpers ───────────────────────────────────────────── */

function fmt(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val === 0) return "$0";
  return `$${val.toLocaleString()}`;
}

function attPct(booked: number, target: number): number {
  if (target <= 0) return 0;
  return (booked / target) * 100;
}

function ragColor(pct: number): string {
  if (pct >= 90) return "#2ECC8A";
  if (pct >= 75) return "#F5A623";
  return "#FF4A2D";
}

function ragBg(pct: number): string {
  if (pct >= 90) return "rgba(46,204,138,0.12)";
  if (pct >= 75) return "rgba(245,166,35,0.12)";
  return "rgba(255,74,45,0.12)";
}

function gapColor(pct: number): string {
  if (pct >= 90) return "#2ECC8A";
  if (pct >= 75) return "#F5A623";
  return "#FF4A2D";
}

/* ── Period data builder ───────────────────────────────── */

interface PeriodData {
  label: string;
  sub: string;
  revBooked: number;
  revTarget: number;
  marBooked: number;
  marTarget: number;
  type: "current" | "next" | "annual";
}

function buildPeriods(
  repKey: string,
  booked: BookedByRepMonth,
  targets: TargetsByRepMonth,
): PeriodData[] {
  // Use uploaded data; fall back to hardcoded George data only if no uploaded data exists
  const hasUploaded = Object.keys(booked).length > 0 || Object.keys(targets).length > 0;
  const rb = hasUploaded ? (booked[repKey] || {}) : (repKey === "george" ? GEORGE_REVENUE_BOOKED : {});
  const rt = hasUploaded ? (targets[repKey] || {}) : (repKey === "george" ? GEORGE_REVENUE_TARGETS : {});

  // March
  const marRevBooked = rb["Mar"] || 0;
  const marRevTarget = rt["Mar"] || 0;

  // April
  const aprRevBooked = rb["Apr"] || 0;
  const aprRevTarget = rt["Apr"] || 0;

  // Q1 (Jan+Feb+Mar)
  const q1Months = ["Jan", "Feb", "Mar"];
  const q1RevBooked = q1Months.reduce((s, m) => s + (rb[m] || 0), 0);
  const q1RevTarget = q1Months.reduce((s, m) => s + (rt[m] || 0), 0);

  // Q2 (Apr+May+Jun)
  const q2Months = ["Apr", "May", "Jun"];
  const q2RevBooked = q2Months.reduce((s, m) => s + (rb[m] || 0), 0);
  const q2RevTarget = q2Months.reduce((s, m) => s + (rt[m] || 0), 0);

  // Annual
  const annRevBooked = ALL_MONTHS.reduce((s, m) => s + (rb[m] || 0), 0);
  const annRevTarget = ALL_MONTHS.reduce((s, m) => s + (rt[m] || 0), 0);

  const MARGIN_RATE = 0.30;

  return [
    {
      label: "MARCH",
      sub: "Current Month",
      revBooked: marRevBooked,
      revTarget: marRevTarget,
      marBooked: marRevBooked * MARGIN_RATE,
      marTarget: marRevTarget * MARGIN_RATE,
      type: "current",
    },
    {
      label: "APRIL",
      sub: "Next Month",
      revBooked: aprRevBooked,
      revTarget: aprRevTarget,
      marBooked: aprRevBooked * MARGIN_RATE,
      marTarget: aprRevTarget * MARGIN_RATE,
      type: "next",
    },
    {
      label: "Q1 2026",
      sub: "Jan — Mar",
      revBooked: q1RevBooked,
      revTarget: q1RevTarget,
      marBooked: q1RevBooked * MARGIN_RATE,
      marTarget: q1RevTarget * MARGIN_RATE,
      type: "current",
    },
    {
      label: "Q2 2026",
      sub: "Apr — Jun",
      revBooked: q2RevBooked,
      revTarget: q2RevTarget,
      marBooked: q2RevBooked * MARGIN_RATE,
      marTarget: q2RevTarget * MARGIN_RATE,
      type: "next",
    },
    {
      label: "ANNUAL",
      sub: "Full Year 2026",
      revBooked: annRevBooked,
      revTarget: annRevTarget,
      marBooked: annRevBooked * MARGIN_RATE,
      marTarget: annRevTarget * MARGIN_RATE,
      type: "annual",
    },
  ];
}

/* ── Header pill colours by type ───────────────────────── */

const headerStyles: Record<string, { bg: string; color: string; border: string }> = {
  current: {
    bg: "rgba(255,74,45,0.10)",
    color: "#FF6B4A",
    border: "0.5px solid rgba(255,74,45,0.25)",
  },
  next: {
    bg: "rgba(79,163,209,0.08)",
    color: "#4FA3D1",
    border: "0.5px solid rgba(79,163,209,0.20)",
  },
  annual: {
    bg: "rgba(167,139,250,0.08)",
    color: "#A78BFA",
    border: "0.5px solid rgba(167,139,250,0.20)",
  },
};

/* ── MetricCard sub-component ──────────────────────────── */

function MetricCard({
  kind,
  booked,
  target,
  barColor,
}: {
  kind: "REVENUE" | "MARGIN";
  booked: number;
  target: number;
  barColor: string;
}) {
  const pct = attPct(booked, target);
  const gap = target - booked;
  const gapPct = target > 0 ? (gap / target) * 100 : 0;
  const stripColor = kind === "REVENUE" ? "#FF4A2D" : "#4FC3D1";

  return (
    <div
      style={{
        background: "#0D1B2E",
        border: "0.5px solid #1E3A5F",
        borderRadius: 6,
        padding: "9px 10px",
        borderTop: `2px solid ${stripColor}`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: orb,
          fontSize: 7,
          color: "#6B7F96",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {kind}
      </span>

      {/* Value + attainment pill */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: orb,
            fontSize: 15,
            fontWeight: 700,
            color: "#F0F4F8",
          }}
        >
          {fmt(booked)}
        </span>
        <span
          style={{
            fontFamily: orb,
            fontSize: 8,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 4,
            background: ragBg(pct),
            color: ragColor(pct),
          }}
        >
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          background: "#1A2D45",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(pct, 100)}%`,
            background: barColor,
            borderRadius: 2,
            transition: "width 0.7s ease",
          }}
        />
      </div>

      {/* Target + gap */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 8, color: "#6B7F96" }}>
          of {fmt(target)}
        </span>
        {gap > 0 && target > 0 && (
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: gapColor(100 - gapPct),
            }}
          >
            −{fmt(gap)}
          </span>
        )}
        {gap <= 0 && target > 0 && (
          <span style={{ fontSize: 8, fontWeight: 600, color: "#2ECC8A" }}>
            On target
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Main ScorecardPanel ───────────────────────────────── */

interface ScorecardPanelProps {
  config: RepConfig;
  booked: BookedByRepMonth;
  targets: TargetsByRepMonth;
}

export default function ScorecardPanel({ config, booked, targets }: ScorecardPanelProps) {
  const periods = buildPeriods(config.key, booked, targets);

  return (
    <div
      style={{
        background: "#0A1929",
        border: "0.5px solid #1E3A5F",
        borderRadius: 8,
        padding: "12px 12px 8px",
      }}
    >
      {/* ROW A: Period headers */}
      <div className="scorecard-grid" style={{ gap: 8, marginBottom: 8 }}>
        {periods.map((p) => {
          const hs = headerStyles[p.type];
          return (
            <div
              key={p.label}
              style={{
                background: hs.bg,
                border: hs.border,
                borderRadius: 5,
                padding: "6px 8px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: orb,
                  fontSize: 9,
                  fontWeight: 700,
                  color: hs.color,
                  letterSpacing: 1.5,
                }}
              >
                {p.label}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 6,
                  color: hs.color,
                  opacity: 0.65,
                  letterSpacing: 1,
                  marginTop: 2,
                }}
              >
                {p.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* ROW B: Revenue cards */}
      <div className="scorecard-grid" style={{ gap: 8, marginBottom: 8 }}>
        {periods.map((p) => (
          <MetricCard
            key={`rev-${p.label}`}
            kind="REVENUE"
            booked={p.revBooked}
            target={p.revTarget}
            barColor={p.type === "current" ? "#FF4A2D" : p.type === "next" ? "#4FA3D1" : "#A78BFA"}
          />
        ))}
      </div>

      {/* ROW C: Margin cards */}
      <div className="scorecard-grid" style={{ gap: 8, marginBottom: 8 }}>
        {periods.map((p) => (
          <MetricCard
            key={`mar-${p.label}`}
            kind="MARGIN"
            booked={p.marBooked}
            target={p.marTarget}
            barColor="#4FC3D1"
          />
        ))}
      </div>

      {/* ROW D: Attainment summary strip */}
      <div
        style={{
          borderTop: "0.5px solid #1E3A5F",
          paddingTop: 8,
        }}
      >
        <div className="scorecard-grid" style={{ gap: 8 }}>
          {periods.map((p) => {
            const pct = attPct(p.revBooked, p.revTarget);
            return (
              <div key={`att-${p.label}`} style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontFamily: orb,
                    fontSize: 17,
                    fontWeight: 700,
                    color: ragColor(pct),
                    display: "block",
                  }}
                >
                  {pct.toFixed(1)}%
                </span>
                <span
                  style={{
                    fontFamily: orb,
                    fontSize: 7,
                    color: "#6B7F96",
                    letterSpacing: 1,
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
