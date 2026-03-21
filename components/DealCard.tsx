"use client";

import { useState } from "react";
import type { ParsedDeal, MeddicScore } from "@/lib/hubspot";
import { dealHealthScore, dealWarmth } from "@/lib/dealHealth";

interface DealCardProps {
  deal: ParsedDeal;
  onClick?: () => void;
  onAIClick?: (deal: ParsedDeal) => void;
  onResearchClick?: (deal: ParsedDeal) => void;
}

// --- Helpers ---

function daysUntilClose(closeDate: string): number {
  if (!closeDate) return Infinity;
  const close = new Date(closeDate).getTime();
  return Math.ceil((close - Date.now()) / (1000 * 60 * 60 * 24));
}

function meddicDotColor(val: string): string {
  const v = val.toLowerCase();
  if (v === "ok" || v === "yes" || v === "done" || v === "complete") return "#2ECC8A";
  if (v === "partial" || v === "wip" || v === "started" || v === "in progress") return "#F5A623";
  if (v && v !== "" && v !== "gap" && v !== "no" && v !== "missing") return "#F5A623";
  return "#FF4A2D";
}

// Left border strip colour
function leftStripColor(deal: ParsedDeal): string {
  const days = daysUntilClose(deal.closeDate);
  const isUrgent = days <= 2 && deal.cat !== "cw";
  if (isUrgent) return "#FF4A2D";
  if (deal.val >= 250_000) return "#F5A623";
  if (deal.cat === "neg") return "#4FA3D1";
  if (deal.cat === "prop") return "#6B7F96";
  return "#2A3F5C";
}

// Stage pill style
function stagePillStyle(stage: string): { bg: string; border: string; text: string } {
  const s = stage.toLowerCase();
  if (s.includes("negotiation"))
    return { bg: "rgba(255,74,45,0.15)", border: "rgba(255,74,45,0.4)", text: "#FF6B4A" };
  if (s.includes("proposal"))
    return { bg: "rgba(79,163,209,0.2)", border: "rgba(79,163,209,0.4)", text: "#4FA3D1" };
  if (s.includes("closed won"))
    return { bg: "rgba(46,204,138,0.2)", border: "rgba(46,204,138,0.4)", text: "#2ECC8A" };
  // Needs Analysis, Qualification, etc.
  return { bg: "rgba(107,127,150,0.15)", border: "rgba(107,127,150,0.3)", text: "#6B7F96" };
}

// Age badge colour — driven by dealWarmth status
function ageColorFromWarmth(status: "warm" | "cooling" | "cold"): string {
  if (status === "warm") return "#2ECC8A";
  if (status === "cooling") return "#F5A623";
  return "#FF4A2D";
}

// Deal value colour
function valueColor(deal: ParsedDeal): string {
  const days = daysUntilClose(deal.closeDate);
  const isUrgent = days <= 2 && deal.cat !== "cw";
  if (isUrgent || deal.cat === "neg") return "#FF4A2D";
  if (deal.val >= 250_000) return "#F5A623";
  return "#F0F4F8";
}

// Days overdue (positive = overdue, 0 = today, negative = future)
function daysOverdue(closeDate: string): number {
  if (!closeDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const close = new Date(closeDate);
  close.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - close.getTime()) / (1000 * 60 * 60 * 24));
}

// Close date colour
function closeDateColor(deal: ParsedDeal): string {
  if (!deal.closeDate || deal.cat === "cw") return "#6B7F96";
  const diff = daysOverdue(deal.closeDate);
  if (diff > 0) return "#FF4A2D";    // overdue — red
  if (diff === 0) return "#F5A623";   // today — amber
  if (Math.abs(diff) <= 7) return "#F5A623"; // within a week — amber
  return "#6B7F96";
}

function closeDateWeight(deal: ParsedDeal): number {
  if (!deal.closeDate || deal.cat === "cw") return 400;
  const diff = daysOverdue(deal.closeDate);
  return diff >= 0 ? 600 : 400;
}

// Persona pill style
function personaPillStyle(persona: string): { bg: string; text: string } {
  const p = persona.toLowerCase();
  if (p.includes("agency"))
    return { bg: "rgba(79,163,209,0.1)", text: "#4FA3D1" };
  if (p.includes("media"))
    return { bg: "rgba(46,204,138,0.1)", text: "#2ECC8A" };
  if (p.includes("enterprise"))
    return { bg: "rgba(167,139,250,0.1)", text: "#A78BFA" };
  if (p.includes("vendasta"))
    return { bg: "rgba(46,204,138,0.1)", text: "#2ECC8A" };
  return { bg: "rgba(107,127,150,0.1)", text: "#6B7F96" };
}

export default function DealCard({ deal, onClick, onAIClick, onResearchClick }: DealCardProps) {
  const [showHealthTip, setShowHealthTip] = useState(false);
  const days = daysUntilClose(deal.closeDate);
  const isUrgent = days <= 2 && deal.cat !== "cw";
  const isWhale = deal.val >= 250_000;
  const isVendasta = deal.rep === "vendasta" || (deal.persona || "").toLowerCase().includes("vendasta");
  const meddicFields = Object.entries(deal.meddic) as [keyof MeddicScore, string][];
  const pill = stagePillStyle(deal.stage);
  const health = dealHealthScore(deal);
  const warmth = dealWarmth(deal);

  return (
    <div
      onClick={onClick}
      style={{
        height: 148,
        borderRadius: 10,
        background: "#1C2F4A",
        border: "0.5px solid #2A3F5C",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "all 150ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#4FA3D1";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2A3F5C";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Left border strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: leftStripColor(deal),
          borderRadius: "2px 0 0 2px",
        }}
      />

      {/* ZONE A — Top row */}
      <div style={{ padding: "8px 8px 0 12px", display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        {/* Company logo */}
        {deal.domain ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://logo.clearbit.com/${deal.domain}`}
            alt=""
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              objectFit: "contain",
              background: "#ffffff",
              padding: 3,
              flexShrink: 0,
              display: "block",
            }}
            onError={(e) => {
              const t = e.currentTarget;
              t.style.display = "none";
              const placeholder = t.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = "flex";
            }}
          />
        ) : null}
        {/* Fallback placeholder — shows if no domain OR if Clearbit returns 404 */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: "#0D1B2E",
            border: "0.5px solid #2A3F5C",
            display: deal.domain ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#6B7F96",
            flexShrink: 0,
          }}
        >
          {deal.name.charAt(0).toUpperCase()}
        </div>

        {/* Stage info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Line 1: Stage pill + age badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                height: 18,
                borderRadius: 9,
                padding: "0 8px",
                fontSize: 10,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                background: pill.bg,
                border: `0.5px solid ${pill.border}`,
                color: pill.text,
                whiteSpace: "nowrap",
              }}
            >
              {deal.stage}
            </span>
            {deal.stageAge > 0 && (
              <span
                style={{
                  background: "#0D1B2E",
                  border: "0.5px solid #2A3F5C",
                  borderRadius: 9,
                  padding: "0 6px",
                  fontSize: 10,
                  color: ageColorFromWarmth(warmth.status),
                  display: "inline-flex",
                  alignItems: "center",
                  height: 18,
                  fontWeight: 500,
                  gap: 2,
                }}
                title={warmth.status === "cold" ? "Deal going cold — send a touchpoint today" : undefined}
              >
                {warmth.status === "cold" && (
                  <span style={{ fontSize: 10, lineHeight: 1 }}>🔥</span>
                )}
                {deal.stageAge}d
              </span>
            )}
          </div>

          {/* Line 2: Deal name */}
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#F0F4F8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 6,
              lineHeight: 1.2,
            }}
          >
            {deal.name}
          </p>

          {/* Line 3: Sub-line */}
          {deal.sub && (
            <p
              style={{
                fontSize: 10,
                color: "#6B7F96",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 4,
                lineHeight: 1.2,
              }}
            >
              {deal.sub}
            </p>
          )}
        </div>
      </div>

      {/* ZONE B — Bottom row */}
      <div
        style={{
          padding: "0 8px 10px 12px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        {/* Left: value + close date */}
        <div>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: valueColor(deal),
              lineHeight: 1,
            }}
          >
            {deal.valShort}
          </p>
          {deal.closeDate && (
            <p
              style={{
                fontSize: 10,
                color: closeDateColor(deal),
                fontWeight: closeDateWeight(deal),
                marginTop: 4,
              }}
            >
              {(() => {
                const diff = daysOverdue(deal.closeDate);
                const dateStr = new Date(deal.closeDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                });
                if (deal.cat === "cw") return dateStr;
                if (diff > 0) return <>{dateStr} — <strong style={{ color: "#FF4A2D" }}>OVERDUE</strong></>;
                if (diff === 0) return <>{dateStr} — <strong style={{ color: "#F5A623" }}>TODAY</strong></>;
                const absDiff = Math.abs(diff);
                if (absDiff <= 7) return `${dateStr} — ${absDiff}d`;
                return dateStr;
              })()}
            </p>
          )}
          {/* Health score badge */}
          <div
            style={{ position: "relative", marginTop: 4 }}
            onMouseEnter={() => setShowHealthTip(true)}
            onMouseLeave={() => setShowHealthTip(false)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--font-orbitron, monospace)",
                color:
                  health.status === "green" ? "#2ECC8A"
                  : health.status === "amber" ? "#F5A623"
                  : "#FF4A2D",
                background:
                  health.status === "green" ? "rgba(46,204,138,0.1)"
                  : health.status === "amber" ? "rgba(245,166,35,0.1)"
                  : "rgba(255,74,45,0.1)",
                border: `0.5px solid ${
                  health.status === "green" ? "rgba(46,204,138,0.3)"
                  : health.status === "amber" ? "rgba(245,166,35,0.3)"
                  : "rgba(255,74,45,0.3)"
                }`,
                padding: "2px 5px",
                borderRadius: 4,
              }}
            >
              MEDDIC {health.score}%
            </div>
            {showHealthTip && health.missing.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: 4,
                  background: "#0D1B2E",
                  border: "0.5px solid #2A3F5C",
                  fontSize: 9,
                  color: "#F0F4F8",
                  padding: "6px 8px",
                  borderRadius: 6,
                  maxWidth: 200,
                  zIndex: 150,
                  whiteSpace: "normal",
                  lineHeight: 1.4,
                }}
              >
                Missing: {health.missing.join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Right: MEDDIC dots + pills + AI button */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {/* MEDDIC dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {meddicFields.map(([key, val]) => (
              <span
                key={key}
                title={`${key}: ${val || "gap"}`}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: val ? meddicDotColor(val) : "#2A3F5C",
                  display: "block",
                }}
              />
            ))}
          </div>

          {/* Pills + AI button */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* Persona pill */}
            {deal.persona && (() => {
              const ps = personaPillStyle(deal.persona);
              return (
                <span
                  style={{
                    fontSize: 9,
                    height: 16,
                    borderRadius: 8,
                    padding: "0 6px",
                    background: ps.bg,
                    color: ps.text,
                    display: "inline-flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {deal.persona}
                </span>
              );
            })()}

            {/* Urgent pill */}
            {isUrgent && (
              <span
                style={{
                  fontSize: 9,
                  height: 16,
                  borderRadius: 8,
                  padding: "0 6px",
                  background: "rgba(255,74,45,0.15)",
                  border: "0.5px solid rgba(255,74,45,0.4)",
                  color: "#FF4A2D",
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                Urgent
              </span>
            )}

            {/* Whale pill */}
            {isWhale && (
              <span
                style={{
                  fontSize: 9,
                  height: 16,
                  borderRadius: 8,
                  padding: "0 6px",
                  background: "rgba(245,166,35,0.15)",
                  border: "0.5px solid rgba(245,166,35,0.4)",
                  color: "#F5A623",
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                Whale
              </span>
            )}

            {/* Vendasta pill */}
            {isVendasta && (
              <span
                style={{
                  fontSize: 9,
                  height: 16,
                  borderRadius: 8,
                  padding: "0 6px",
                  background: "rgba(46,204,138,0.1)",
                  color: "#2ECC8A",
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                Vendasta
              </span>
            )}

            {/* AI button */}
            {deal.hasResearch ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAIClick?.(deal);
                }}
                style={{
                  width: 28,
                  height: 22,
                  borderRadius: 6,
                  background: "rgba(167,139,250,0.2)",
                  border: "0.5px solid rgba(167,139,250,0.4)",
                  color: "#A78BFA",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  marginLeft: 2,
                }}
                title="AI Research Available"
              >
                &#10022;
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResearchClick?.(deal);
                }}
                style={{
                  width: 28,
                  height: 22,
                  borderRadius: 6,
                  background: "rgba(245,166,35,0.1)",
                  border: "0.5px solid rgba(245,166,35,0.3)",
                  color: "#F5A623",
                  fontSize: 11,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  marginLeft: 2,
                }}
                title="Research needed"
              >
                ⚠
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
