"use client";

import type { ParsedDeal } from "@/lib/hubspot";
import { REP_CONFIGS } from "@/lib/reps";

interface DrawerHeroProps {
  deal: ParsedDeal;
}

const HUBSPOT_PORTAL = "47345959";

// Pipeline stages in order
const PIPELINE_STAGES = [
  { key: "leads-qual", label: "Qual", cat: "leads", stage: "Qualification" },
  { key: "leads-na", label: "Needs Analysis", cat: "leads", stage: "Needs Analysis" },
  { key: "prop", label: "Proposal", cat: "prop", stage: "Proposal" },
  { key: "neg", label: "Negotiation", cat: "neg", stage: "Negotiation" },
  { key: "cw", label: "Closed Won", cat: "cw", stage: "Closed Won" },
];

function getStageIndex(deal: ParsedDeal): number {
  const s = deal.stage.toLowerCase();
  if (s.includes("qualification")) return 0;
  if (s.includes("needs analysis")) return 1;
  if (s.includes("proposal")) return 2;
  if (s.includes("negotiation")) return 3;
  if (s.includes("closed won")) return 4;
  if (s.includes("closed lost")) return -1;
  return 0;
}

function daysOverdue(closeDate: string): number {
  if (!closeDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const close = new Date(closeDate);
  close.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - close.getTime()) / (1000 * 60 * 60 * 24));
}

function getRepInfo(repKey: string): { name: string; flag: "ca" | "uk" | null } {
  const config = REP_CONFIGS.find((r) => r.key === repKey);
  if (!config) return { name: repKey, flag: null };
  return { name: config.name, flag: config.flag || null };
}

export default function DrawerHero({ deal }: DrawerHeroProps) {
  const stageIdx = getStageIndex(deal);
  const isClosedLost = deal.cat === "cl";
  const isClosedWon = deal.cat === "cw";
  const repInfo = getRepInfo(deal.rep);
  const primaryContact = deal.contacts[0];

  // Close date formatting
  const closeDateStr = deal.closeDate
    ? new Date(deal.closeDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const overdueDays = deal.closeDate ? daysOverdue(deal.closeDate) : 0;
  const isOverdue = overdueDays > 0 && !isClosedWon;

  // Activity color
  const activityColor =
    deal.stageAge > 14 ? "#FF4A2D" : deal.stageAge > 7 ? "#F5A623" : "#6B7F96";

  // Stage age color
  const stageAgeColor = deal.stageAge > 30 ? "#F5A623" : "#6B7F96";

  // Value color
  const valColor = isClosedWon ? "#2ECC8A" : "#FF4A2D";

  return (
    <div style={{ backgroundColor: "#194766", padding: "16px 20px 14px" }}>
      {/* LINE 1 — Stage progress bar */}
      {!isClosedLost && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            {PIPELINE_STAGES.map((ps, i) => {
              const isCompleted = i < stageIdx;
              const isCurrent = i === stageIdx;
              const isFuture = i > stageIdx;

              return (
                <div key={ps.key} style={{ display: "flex", alignItems: "center", flex: i < PIPELINE_STAGES.length - 1 ? 1 : 0 }}>
                  {/* Dot */}
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: isCompleted
                        ? "#2ECC8A"
                        : isCurrent
                        ? "#FF4A2D"
                        : "#2A3F5C",
                      boxShadow: isCurrent ? "0 0 6px rgba(255,74,45,0.5)" : "none",
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                  {/* Connecting line */}
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        background: isCompleted ? "#2ECC8A" : "#2A3F5C",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Stage labels */}
          <div style={{ display: "flex", marginTop: 4 }}>
            {PIPELINE_STAGES.map((ps, i) => (
              <div
                key={ps.key}
                style={{
                  flex: 1,
                  fontSize: 8,
                  color: i === stageIdx ? "#FF4A2D" : "#6B7F96",
                  fontWeight: i === stageIdx ? 600 : 400,
                  textAlign: i === 0 ? "left" : i === PIPELINE_STAGES.length - 1 ? "right" : "center",
                }}
              >
                {ps.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closed Lost indicator */}
      {isClosedLost && (
        <div style={{ marginBottom: 10 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 10,
            background: "rgba(255,74,45,0.15)",
            border: "0.5px solid rgba(255,74,45,0.4)",
            color: "#FF4A2D",
          }}>
            Closed Lost
          </span>
        </div>
      )}

      {/* LINE 2 — Deal name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {deal.domain && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://logo.clearbit.com/${deal.domain}`}
            alt=""
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              objectFit: "contain",
              background: "#ffffff",
              padding: 3,
              flexShrink: 0,
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F0F4F8", lineHeight: 1.2, margin: 0 }}>
          {deal.name}
        </h2>
      </div>

      {/* LINE 3 — Key attributes */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: valColor }}>{deal.valShort}</span>
        {deal.persona && (
          <>
            <span style={{ color: "#4A6380", fontSize: 13 }}>·</span>
            <span style={{ fontSize: 13, color: "#4FA3D1" }}>{deal.persona}</span>
          </>
        )}
        <span style={{ color: "#4A6380", fontSize: 13 }}>·</span>
        <span style={{ fontSize: 13, color: "#F0F4F8" }}>{repInfo.name}</span>
        {repInfo.flag && (
          <span style={{ fontSize: 14 }}>
            {repInfo.flag === "ca" ? "🇨🇦" : "🇬🇧"}
          </span>
        )}
      </div>

      {/* LINE 4 — Timeline stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
        {closeDateStr && (
          <span style={{ fontSize: 12, color: isOverdue ? "#FF4A2D" : "#6B7F96", fontWeight: isOverdue ? 600 : 400 }}>
            Close: {closeDateStr}{isOverdue ? " — OVERDUE" : ""}
          </span>
        )}
        {deal.stageAge > 0 && (
          <>
            <span style={{ color: "#4A6380", fontSize: 12 }}>·</span>
            <span style={{ fontSize: 12, color: stageAgeColor }}>
              In stage: {deal.stageAge} day{deal.stageAge !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {deal.stageAge > 0 && (
          <>
            <span style={{ color: "#4A6380", fontSize: 12 }}>·</span>
            <span style={{ fontSize: 12, color: activityColor }}>
              Last activity: {deal.stageAge === 1 ? "1 day ago" : `${deal.stageAge} days ago`}
            </span>
          </>
        )}
      </div>

      {/* LINE 5 — Primary contact */}
      <div style={{ marginTop: 8 }}>
        {primaryContact ? (
          <span style={{ fontSize: 12 }}>
            <span style={{ color: "#F0F4F8" }}>
              Primary: {primaryContact.name}
              {primaryContact.role ? `, ${primaryContact.role}` : ""}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#F5A623", fontStyle: "italic" }}>
            No primary contact — add one
          </span>
        )}
      </div>

      {/* LINE 6 — Open in HubSpot */}
      {deal.hsId && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <a
            href={`https://app.hubspot.com/contacts/${HUBSPOT_PORTAL}/record/0-3/${deal.hsId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: "#4FA3D1",
              border: "1px solid #2A3F5C",
              borderRadius: 6,
              padding: "4px 10px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Open in HubSpot ↗
          </a>
        </div>
      )}
    </div>
  );
}
