"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { ParsedDeal } from "@/lib/hubspot";
import { dealHealthScore, dealWarmth } from "@/lib/dealHealth";
import DrawerHero from "./DrawerHero";
import DrawerSection from "./DrawerSection";
import MeddicGrid from "./MeddicGrid";
import ContactsList from "./ContactsList";
import DocStatusGrid from "./DocStatusGrid";
import ResearchPanel from "./ResearchPanel";

interface DealDrawerProps {
  deal: ParsedDeal | null;
  onClose: () => void;
}

const HUBSPOT_PORTAL = "47345959";

const TONE_OPTIONS = [
  { key: "warm", label: "Warm & Relationship" },
  { key: "direct", label: "Direct & Commercial" },
  { key: "followup", label: "Follow-Up" },
  { key: "urgency", label: "Urgency / Close" },
  { key: "checkin", label: "Check-In" },
] as const;

type ToneKey = (typeof TONE_OPTIONS)[number]["key"];

interface LogOp {
  type: string;
  field: string;
  currentValue: string;
  newValue: string;
  hubspotProperty: string | null;
  hubspotValue: string;
}

// Section icons as inline SVGs
const IconAction = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconLog = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 3h10M2 7h10M2 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconEmail = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconMeddic = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconContacts = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="4" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 13c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconDocs = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 1h5l4 4v8H3V1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);
const IconDetails = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 6v4M7 4.5v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function DealDrawer({ deal, onClose }: DealDrawerProps) {
  // --- Log to HubSpot state ---
  const [logText, setLogText] = useState("");
  const [logOps, setLogOps] = useState<LogOp[] | null>(null);
  const [logSummary, setLogSummary] = useState("");
  const [logStatus, setLogStatus] = useState<"idle" | "parsing" | "saving" | "saved" | "error">("idle");
  const [logError, setLogError] = useState<string | null>(null);
  const [stageWarning, setStageWarning] = useState<{
    score: number;
    missing: string[];
    message: string;
  } | null>(null);

  // --- Draft email state ---
  const [emailTone, setEmailTone] = useState<ToneKey>("warm");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // --- Research panel state ---
  const [showResearch, setShowResearch] = useState(false);

  // --- Deep research trigger state ---
  const [researchToast, setResearchToast] = useState(false);

  // --- Keep Warm outreach state ---
  const [outreachChannel, setOutreachChannel] = useState<"email" | "linkedin" | "sms" | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachData, setOutreachData] = useState<{ subject?: string; body?: string; message?: string } | null>(null);
  const [outreachSent, setOutreachSent] = useState(false);
  const [outreachLogged, setOutreachLogged] = useState(false);
  const [outreachToast, setOutreachToast] = useState<string | null>(null);

  // --- Nudge banner dismiss state (session-only) ---
  const [dismissHealth, setDismissHealth] = useState(false);
  const [dismissResearch, setDismissResearch] = useState(false);
  const [dismissStageGate, setDismissStageGate] = useState(false);
  const meddicRef = useRef<HTMLDivElement>(null);

  // Reset all states when deal changes
  useEffect(() => {
    setLogText("");
    setLogOps(null);
    setLogSummary("");
    setLogStatus("idle");
    setLogError(null);
    setStageWarning(null);
    setEmailTone("warm");
    setEmailSubject("");
    setEmailBody("");
    setEmailLoading(false);
    setEmailCopied(false);
    setShowResearch(false);
    setOutreachChannel(null);
    setOutreachLoading(false);
    setOutreachData(null);
    setOutreachSent(false);
    setOutreachLogged(false);
    setOutreachToast(null);
    setDismissHealth(false);
    setDismissResearch(false);
    setDismissStageGate(false);
  }, [deal?.id]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showResearch) {
          setShowResearch(false);
        } else {
          onClose();
        }
      }
    }
    if (deal) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [deal, onClose, showResearch]);

  // --- Parse & Preview ---
  const handleParsePreview = useCallback(async () => {
    if (!logText.trim() || !deal) return;
    setLogStatus("parsing");
    setLogError(null);
    try {
      const res = await fetch("/api/ai/parse-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: logText, deal }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = data.error?.includes("not configured")
          ? "AI features require ANTHROPIC_API_KEY to be set in Railway. Contact George to configure."
          : data.error || "Parse failed";
        throw new Error(msg);
      }
      setLogOps(data.ops || []);
      setLogSummary(data.summary || "");
      setStageWarning(data.warning || null);
      setLogStatus("idle");
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Parse failed");
      setLogStatus("error");
    }
  }, [logText, deal]);

  // --- Confirm & execute ---
  const handleConfirmLog = useCallback(async () => {
    if (!deal || !logOps) return;
    setLogStatus("saving");
    setLogError(null);
    try {
      const propUpdates: Record<string, string> = {};
      const notes: string[] = [];

      for (const op of logOps) {
        if (op.type === "add_note") {
          notes.push(op.hubspotValue);
        } else if (op.hubspotProperty) {
          propUpdates[op.hubspotProperty] = op.hubspotValue;
        }
      }

      if (Object.keys(propUpdates).length > 0) {
        const patchRes = await fetch(`/api/hubspot/deal/${deal.id}/update`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ properties: propUpdates }),
        });
        if (!patchRes.ok) throw new Error("Failed to update deal properties");
      }

      for (const note of notes) {
        const noteRes = await fetch(`/api/hubspot/deal/${deal.id}/note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        });
        if (!noteRes.ok) throw new Error("Failed to add note");
      }

      setLogStatus("saved");
      setLogText("");
      setLogOps(null);
      setLogSummary("");
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Save failed");
      setLogStatus("error");
    }
  }, [deal, logOps]);

  // --- Generate email ---
  const handleGenerateEmail = useCallback(async () => {
    if (!deal) return;
    setEmailLoading(true);
    setEmailCopied(false);
    try {
      const res = await fetch("/api/ai/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal, tone: emailTone }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = data.error?.includes("not configured")
          ? "AI features require ANTHROPIC_API_KEY to be set in Railway. Contact George to configure."
          : data.error || "Email generation failed";
        throw new Error(msg);
      }
      setEmailSubject(data.subject || "");
      setEmailBody(data.body || "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Email generation failed";
      setEmailSubject("");
      setEmailBody(`[Error] ${msg}`);
    } finally {
      setEmailLoading(false);
    }
  }, [deal, emailTone]);

  const handleCopyEmail = useCallback(() => {
    const text = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }, [emailSubject, emailBody]);

  const handleDeepResearch = useCallback(() => {
    if (!deal) return;
    const projectUrl =
      "https://claude.ai/project/" +
      process.env.NEXT_PUBLIC_CLAUDE_PROJECT_ID;
    const trigger = `New Lead — ${deal.name}, ${deal.persona || "Partner"}`;
    navigator.clipboard.writeText(trigger).catch(() => {});
    window.open(projectUrl, "_blank");
    setResearchToast(true);
    setTimeout(() => setResearchToast(false), 3000);
  }, [deal]);

  // --- Outreach message generator ---
  const handleOutreach = useCallback(async (channel: "email" | "linkedin" | "sms") => {
    if (!deal) return;
    setOutreachChannel(channel);
    setOutreachLoading(true);
    setOutreachData(null);
    setOutreachSent(false);
    setOutreachLogged(false);
    try {
      const res = await fetch("/api/ai/outreach-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealName: deal.name,
          stage: deal.stage,
          daysStale: deal.stageAge,
          contacts: deal.contacts,
          lastActivity: deal.closeDate,
          meddicNotes: deal.meddicNotes,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Generation failed");
      setOutreachData(data);
    } catch {
      setOutreachData({ message: "[Error] Could not generate message. Try again." });
    } finally {
      setOutreachLoading(false);
    }
  }, [deal]);

  // --- Send actions ---
  const handleOutreachSend = useCallback(() => {
    if (!outreachData || !outreachChannel) return;
    if (outreachChannel === "email") {
      const subject = encodeURIComponent(outreachData.subject || "");
      const body = encodeURIComponent(outreachData.body || "");
      window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
    } else if (outreachChannel === "linkedin") {
      navigator.clipboard.writeText(outreachData.message || "");
      window.open("https://linkedin.com", "_blank");
      setOutreachToast("Message copied — paste into LinkedIn DM");
      setTimeout(() => setOutreachToast(null), 3000);
    } else if (outreachChannel === "sms") {
      const body = encodeURIComponent(outreachData.message || "");
      window.open(`sms:?body=${body}`, "_self");
    }
    setOutreachSent(true);
  }, [outreachData, outreachChannel]);

  const handleOutreachCopy = useCallback(() => {
    if (!outreachData) return;
    const text = outreachChannel === "email"
      ? `Subject: ${outreachData.subject}\n\n${outreachData.body}`
      : outreachData.message || "";
    navigator.clipboard.writeText(text);
    setOutreachToast("Copied to clipboard");
    setTimeout(() => setOutreachToast(null), 2000);
  }, [outreachData, outreachChannel]);

  // --- Log outreach to HubSpot ---
  const handleLogOutreach = useCallback(async () => {
    if (!deal || !outreachData || !outreachChannel) return;
    const preview = outreachChannel === "email"
      ? (outreachData.body || "").substring(0, 100)
      : (outreachData.message || "").substring(0, 100);
    const noteBody = `Outreach sent via ${outreachChannel} — ${preview}`;
    try {
      const res = await fetch(`/api/hubspot/deal/${deal.id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteBody }),
      });
      if (!res.ok) throw new Error("Failed to log");
      setOutreachLogged(true);
      setOutreachToast("Logged — deal timer reset");
      setTimeout(() => setOutreachToast(null), 3000);
    } catch {
      setOutreachToast("Failed to log — try again");
      setTimeout(() => setOutreachToast(null), 3000);
    }
  }, [deal, outreachData, outreachChannel]);

  if (!deal) return null;

  const hubspotUrl = `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL}/record/0-3/${deal.hsId}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-card z-50 shadow-2xl flex flex-col animate-slide-in">
        {/* Close button */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="fixed top-[96px] sm:top-4 right-4 z-[150] min-w-[44px] min-h-[44px] w-11 h-11 sm:w-8 sm:h-8 rounded-lg bg-navy/50 hover:bg-navy flex items-center justify-center text-muted hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Nudge banners */}
          {(() => {
            const health = dealHealthScore(deal);
            const missingDocs: string[] = [];
            if (deal.cat === "neg") {
              if (deal.msa === "Not sent" || deal.msa === "Not signed") missingDocs.push("MSA not signed");
              if (deal.credit === "Not sent" || deal.credit === "Not returned") missingDocs.push("Credit App not returned");
              if (deal.sow === "Not sent" || deal.sow === "Not signed") missingDocs.push("SOW not signed");
            }
            return (
              <>
                {/* Health nudge — amber */}
                {health.score < 80 && !dismissHealth && (
                  <div style={{
                    background: "rgba(245,166,35,0.08)",
                    borderBottom: "0.5px solid rgba(245,166,35,0.25)",
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>⚠</span>
                    <span style={{ fontSize: 10, color: "#F5A623", flex: 1 }}>
                      {health.score < 50
                        ? `Deal needs attention — ${health.missing.length} items missing before this can advance`
                        : `${health.missing.length} items will strengthen this deal`}
                    </span>
                    <button
                      onClick={() => meddicRef.current?.scrollIntoView({ behavior: "smooth" })}
                      style={{ fontSize: 10, color: "#F5A623", fontWeight: 600, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Review ↓
                    </button>
                    <button
                      onClick={() => setDismissHealth(true)}
                      style={{ fontSize: 12, color: "#F5A623", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                {/* Research nudge — purple */}
                {!deal.hasResearch && !dismissResearch && (
                  <div style={{
                    background: "rgba(167,139,250,0.08)",
                    borderBottom: "0.5px solid rgba(167,139,250,0.2)",
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 10, color: "#A78BFA", flex: 1 }}>
                      No research on file — deep research recommended before next meeting
                    </span>
                    <button
                      onClick={handleDeepResearch}
                      style={{ fontSize: 10, color: "#A78BFA", fontWeight: 600, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      ✦ Launch Research →
                    </button>
                    <button
                      onClick={() => setDismissResearch(true)}
                      style={{ fontSize: 12, color: "#A78BFA", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                {/* Stage gate nudge — red (Negotiation only) */}
                {deal.cat === "neg" && missingDocs.length > 0 && !dismissStageGate && (
                  <div style={{
                    background: "rgba(255,74,45,0.08)",
                    borderBottom: "0.5px solid rgba(255,74,45,0.2)",
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 10, color: "#FF4A2D", flex: 1 }}>
                      Closing checklist incomplete — {missingDocs.join(" · ")}
                    </span>
                    <button
                      onClick={() => setDismissStageGate(true)}
                      style={{ fontSize: 12, color: "#FF4A2D", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </>
            );
          })()}
          <DrawerHero deal={deal} />

          <div className="px-6 pb-6">
            {/* Section 1: Next Action */}
            <DrawerSection title="Next Action" icon={IconAction}>
              <div className="flex gap-2">
                <button className="flex-1 bg-blue hover:bg-blue/80 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors">
                  {deal.action1}
                </button>
                <button className="flex-1 bg-navy/50 hover:bg-navy border border-border text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors">
                  {deal.action2}
                </button>
              </div>
              {deal.hasResearch && (
                <button
                  onClick={() => setShowResearch(true)}
                  className="mt-2 w-full bg-[#7C3AED]/15 text-[#7C3AED] text-sm font-medium py-2 rounded-lg hover:bg-[#7C3AED]/25 transition-colors flex items-center justify-center gap-2"
                >
                  <span>&#10022;</span> View Research Brief
                </button>
              )}
            </DrawerSection>

            {/* Deep Research trigger */}
            <div id="research-section" className="mb-4">
              <button
                onClick={handleDeepResearch}
                className="w-full text-left cursor-pointer transition-colors"
                style={{
                  background: deal.hasResearch ? "transparent" : "rgba(139, 92, 246, 0.15)",
                  border: deal.hasResearch ? "1px solid rgba(139, 92, 246, 0.25)" : "1px solid rgba(139, 92, 246, 0.4)",
                  color: deal.hasResearch ? "rgba(167, 139, 250, 0.6)" : "#A78BFA",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 11,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(139, 92, 246, 0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = deal.hasResearch
                    ? "transparent"
                    : "rgba(139, 92, 246, 0.15)";
                }}
              >
                {deal.hasResearch ? "↺ Update Research" : "✦ Launch Deep Research"}
              </button>
            </div>

            {/* Keep Warm section — only when nudgeRequired */}
            {(() => {
              const warmth = dealWarmth(deal);
              if (!warmth.nudgeRequired) return null;

              // Smart channel recommendation
              const hasEmail = deal.contacts.length > 0;
              const hasPhone = false; // contacts don't expose phone currently
              const isNeg = deal.cat === "neg";
              const isProp = deal.cat === "prop";
              const recommended: "email" | "linkedin" | "sms" =
                hasEmail && isNeg ? "email"
                : hasEmail && isProp ? "email"
                : !hasEmail ? "linkedin"
                : "email";
              const recommendLabel =
                hasEmail && isNeg ? "Email recommended — close stage"
                : hasEmail && isProp ? "Email recommended — follow up on proposal"
                : !hasEmail ? "LinkedIn recommended — no email on file"
                : "Email recommended";

              return (
                <DrawerSection title="Keep Warm" icon={
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1C7 1 3 5 3 8a4 4 0 008 0c0-3-4-7-4-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                }>
                  {/* Warmth status pill */}
                  <div style={{ marginBottom: 10 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 10,
                        background: warmth.status === "cold" ? "rgba(255,74,45,0.12)" : "rgba(245,166,35,0.12)",
                        border: `0.5px solid ${warmth.status === "cold" ? "rgba(255,74,45,0.4)" : "rgba(245,166,35,0.4)"}`,
                        color: warmth.status === "cold" ? "#FF4A2D" : "#F5A623",
                      }}
                    >
                      {warmth.status === "cold"
                        ? `🔥 ${warmth.daysStale}d — send today`
                        : `⚠ ${warmth.daysStale}d since last contact`}
                    </span>
                  </div>

                  {/* Smart recommendation chip */}
                  <button
                    onClick={() => handleOutreach(recommended)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 10,
                      background: "rgba(79,195,209,0.1)",
                      border: "0.5px solid rgba(79,195,209,0.3)",
                      color: "#4FC3D1",
                      cursor: "pointer",
                      marginBottom: 10,
                    }}
                  >
                    ✦ Recommended: {recommended === "email" ? "Email" : recommended === "linkedin" ? "LinkedIn" : "SMS"} — {recommendLabel.split(" — ")[1] || ""}
                  </button>

                  {/* Channel buttons */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <button
                      onClick={() => handleOutreach("email")}
                      disabled={outreachLoading}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "8px 0",
                        borderRadius: 8,
                        background: outreachChannel === "email" ? "rgba(79,195,209,0.15)" : "rgba(42,63,92,0.5)",
                        border: outreachChannel === "email" ? "0.5px solid rgba(79,195,209,0.4)" : "0.5px solid #2A3F5C",
                        color: outreachChannel === "email" ? "#4FC3D1" : "#6B7F96",
                        cursor: "pointer",
                      }}
                    >
                      ✉ Email
                    </button>
                    <button
                      onClick={() => handleOutreach("linkedin")}
                      disabled={outreachLoading}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "8px 0",
                        borderRadius: 8,
                        background: outreachChannel === "linkedin" ? "rgba(79,195,209,0.15)" : "rgba(42,63,92,0.5)",
                        border: outreachChannel === "linkedin" ? "0.5px solid rgba(79,195,209,0.4)" : "0.5px solid #2A3F5C",
                        color: outreachChannel === "linkedin" ? "#4FC3D1" : "#6B7F96",
                        cursor: "pointer",
                      }}
                    >
                      in LinkedIn
                    </button>
                    <button
                      onClick={() => handleOutreach("sms")}
                      disabled={outreachLoading || !hasPhone}
                      title={!hasPhone ? "Add a phone number to contacts to enable SMS" : undefined}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "8px 0",
                        borderRadius: 8,
                        background: outreachChannel === "sms" ? "rgba(79,195,209,0.15)" : "rgba(42,63,92,0.5)",
                        border: outreachChannel === "sms" ? "0.5px solid rgba(79,195,209,0.4)" : "0.5px solid #2A3F5C",
                        color: !hasPhone ? "#3A4F6C" : outreachChannel === "sms" ? "#4FC3D1" : "#6B7F96",
                        cursor: !hasPhone ? "not-allowed" : "pointer",
                        opacity: !hasPhone ? 0.5 : 1,
                      }}
                    >
                      💬 Text
                    </button>
                  </div>

                  {/* Loading state */}
                  {outreachLoading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
                      <span className="w-3 h-3 border-2 border-[#4FC3D1] border-t-transparent rounded-full animate-spin" />
                      <span style={{ fontSize: 10, color: "#6B7F96" }}>Generating message...</span>
                    </div>
                  )}

                  {/* Message preview */}
                  {outreachData && !outreachLoading && (
                    <div>
                      {outreachChannel === "email" && outreachData.subject && (
                        <div style={{ marginBottom: 6 }}>
                          <p style={{ fontSize: 9, color: "#6B7F96", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Subject</p>
                          <p style={{ fontSize: 11, color: "#F0F4F8" }}>{outreachData.subject}</p>
                        </div>
                      )}
                      <div style={{ marginBottom: 8 }}>
                        {outreachChannel === "email" && (
                          <p style={{ fontSize: 9, color: "#6B7F96", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Body</p>
                        )}
                        <p style={{ fontSize: 11, color: "#F0F4F8", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {outreachChannel === "email" ? outreachData.body : outreachData.message}
                        </p>
                      </div>

                      {/* Send + Copy buttons */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        <button
                          onClick={handleOutreachSend}
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "5px 12px",
                            borderRadius: 6,
                            background: "rgba(46,204,138,0.15)",
                            border: "0.5px solid rgba(46,204,138,0.3)",
                            color: "#2ECC8A",
                            cursor: "pointer",
                          }}
                        >
                          {outreachChannel === "email" ? "Open in Mail" : outreachChannel === "linkedin" ? "Copy + Open LinkedIn" : "Open in Messages"}
                        </button>
                        <button
                          onClick={handleOutreachCopy}
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: "5px 12px",
                            borderRadius: 6,
                            background: "none",
                            border: "0.5px solid #2A3F5C",
                            color: "#6B7F96",
                            cursor: "pointer",
                          }}
                        >
                          Copy
                        </button>
                      </div>

                      {/* Log after send */}
                      {outreachSent && !outreachLogged && (
                        <div
                          style={{
                            background: "rgba(46,204,138,0.06)",
                            border: "0.5px solid rgba(46,204,138,0.25)",
                            borderRadius: 8,
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 10, color: "#F0F4F8", flex: 1 }}>Did you send the message?</span>
                          <button
                            onClick={handleLogOutreach}
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "rgba(46,204,138,0.15)",
                              border: "0.5px solid rgba(46,204,138,0.3)",
                              color: "#2ECC8A",
                              cursor: "pointer",
                            }}
                          >
                            Yes — log it
                          </button>
                          <button
                            onClick={() => setOutreachSent(false)}
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "none",
                              border: "0.5px solid #2A3F5C",
                              color: "#6B7F96",
                              cursor: "pointer",
                            }}
                          >
                            Later
                          </button>
                        </div>
                      )}
                      {outreachLogged && (
                        <p style={{ fontSize: 10, color: "#2ECC8A", fontWeight: 600 }}>Logged — deal timer reset</p>
                      )}
                    </div>
                  )}
                </DrawerSection>
              );
            })()}

            {/* Section 2: Log to HubSpot */}
            <DrawerSection title="Log to HubSpot" icon={IconLog}>
              <textarea
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder='Plain English: "Move close date to April 15, add a note that Sam confirmed SOW receipt"'
                className="w-full bg-navy/50 border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-muted resize-none focus:outline-none focus:border-blue"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleParsePreview}
                  disabled={!logText.trim() || logStatus === "parsing"}
                  className="bg-amber/20 text-amber text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {logStatus === "parsing" ? (
                    <>
                      <span className="w-3 h-3 border-2 border-amber border-t-transparent rounded-full animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>&#10022; Parse &amp; Preview</>
                  )}
                </button>
              </div>

              {/* Preview table */}
              {logOps && logOps.length > 0 && (
                <div className="mt-3">
                  {logSummary && (
                    <p className="text-muted text-xs mb-2">{logSummary}</p>
                  )}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted">
                        <th className="text-left py-1 font-medium">Change</th>
                        <th className="text-left py-1 font-medium">Current</th>
                        <th className="text-left py-1 font-medium">New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logOps.map((op, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="py-1.5 text-white">{op.field}</td>
                          <td className="py-1.5 text-muted">{op.currentValue}</td>
                          <td className="py-1.5 text-green">
                            {op.type === "add_note" ? (
                              <span className="italic">{op.newValue}</span>
                            ) : (
                              op.newValue
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Stage gate warning */}
                  {stageWarning && (
                    <div
                      style={{
                        border: "0.5px solid rgba(245,166,35,0.4)",
                        background: "rgba(245,166,35,0.06)",
                        borderRadius: 8,
                        padding: "12px 14px",
                        marginTop: 8,
                        marginBottom: 8,
                      }}
                    >
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#F5A623", marginBottom: 4 }}>
                        ⚠ Stage advance — deal incomplete
                      </p>
                      <p style={{ fontSize: 10, color: "#F0F4F8", marginBottom: 6 }}>
                        {stageWarning.score}% complete · {stageWarning.missing.length} items missing
                      </p>
                      <ul style={{ fontSize: 10, color: "#6B7F96", marginBottom: 8, paddingLeft: 14 }}>
                        {stageWarning.missing.slice(0, 3).map((item) => (
                          <li key={item} style={{ marginBottom: 2 }}>{item}</li>
                        ))}
                        {stageWarning.missing.length > 3 && (
                          <li style={{ color: "#F5A623" }}>+{stageWarning.missing.length - 3} more</li>
                        )}
                      </ul>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => {
                            setLogOps(null);
                            setLogSummary("");
                            setStageWarning(null);
                            setLogStatus("idle");
                            meddicRef.current?.scrollIntoView({ behavior: "smooth" });
                          }}
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#2ECC8A",
                            background: "rgba(46,204,138,0.15)",
                            border: "0.5px solid rgba(46,204,138,0.3)",
                            borderRadius: 6,
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Complete first
                        </button>
                        <button
                          onClick={() => {
                            setStageWarning(null);
                            handleConfirmLog();
                          }}
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: "#6B7F96",
                            background: "none",
                            border: "0.5px solid #2A3F5C",
                            borderRadius: 6,
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Advance anyway
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleConfirmLog}
                      disabled={logStatus === "saving"}
                      className="bg-green/20 text-green text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green/30 transition-colors disabled:opacity-50"
                    >
                      {logStatus === "saving" ? "Saving..." : "Confirm & Write"}
                    </button>
                    <button
                      onClick={() => { setLogOps(null); setLogSummary(""); setStageWarning(null); setLogStatus("idle"); }}
                      className="bg-navy/50 text-muted text-xs font-medium px-3 py-1.5 rounded-lg hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {logStatus === "saved" && (
                <p className="text-green text-xs mt-2">Changes saved to HubSpot</p>
              )}
              {logError && (
                <p className="text-orange text-xs mt-2">{logError}</p>
              )}
            </DrawerSection>

            {/* Section 3: Draft Client Email */}
            <DrawerSection title="Draft Client Email" icon={IconEmail}>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone.key}
                    onClick={() => setEmailTone(tone.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                      emailTone === tone.key
                        ? "bg-blue text-white"
                        : "bg-navy/50 text-muted hover:text-white"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateEmail}
                disabled={emailLoading}
                className="w-full bg-[#7C3AED]/20 text-[#7C3AED] text-sm font-medium py-2 rounded-lg hover:bg-[#7C3AED]/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {emailLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>&#10022; Generate Email</>
                )}
              </button>

              {(emailSubject || emailBody) && (
                <div className="mt-3 space-y-2">
                  <div className="bg-navy/50 rounded-lg px-3 py-2">
                    <p className="text-muted text-[10px] uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-white text-sm">{emailSubject}</p>
                  </div>
                  <div className="bg-navy/50 rounded-lg px-3 py-2">
                    <p className="text-muted text-[10px] uppercase tracking-wider mb-1">Body</p>
                    <p className="text-white text-sm whitespace-pre-wrap">{emailBody}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyEmail}
                      className="bg-green/20 text-green text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green/30 transition-colors"
                    >
                      {emailCopied ? "Copied!" : "Copy to Clipboard"}
                    </button>
                    <button
                      onClick={handleGenerateEmail}
                      disabled={emailLoading}
                      className="bg-navy/50 text-muted text-xs font-medium px-3 py-1.5 rounded-lg hover:text-white transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </DrawerSection>

            {/* Section 4: MEDDIC */}
            <div ref={meddicRef} />
            <DrawerSection title="MEDDIC" icon={IconMeddic}>
              <MeddicGrid meddic={deal.meddic} meddicNotes={deal.meddicNotes} />
            </DrawerSection>

            {/* Section 5: Contacts */}
            <DrawerSection title="Contacts" icon={IconContacts}>
              <ContactsList contacts={deal.contacts} />
            </DrawerSection>

            {/* Section 6: Document Status */}
            <DrawerSection title="Document Status" icon={IconDocs}>
              <DocStatusGrid
                nda={deal.nda}
                msa={deal.msa}
                sow={deal.sow}
                credit={deal.credit}
                bizdev={deal.bizdev}
                partner={deal.partner}
              />
            </DrawerSection>

            {/* Section 7: Deal Details */}
            <DrawerSection title="Deal Details" icon={IconDetails}>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-navy/50 rounded-lg px-3 py-2.5">
                  <p className="text-muted text-[10px] uppercase tracking-wider">Stage</p>
                  <p className="text-white text-xs mt-0.5">{deal.stage}</p>
                </div>
                <div className="bg-navy/50 rounded-lg px-3 py-2.5">
                  <p className="text-muted text-[10px] uppercase tracking-wider">Rep</p>
                  <p className="text-white text-xs mt-0.5 capitalize">{deal.rep}</p>
                </div>
                <div className="bg-navy/50 rounded-lg px-3 py-2.5">
                  <p className="text-muted text-[10px] uppercase tracking-wider">Vendasta Track</p>
                  <p className="text-white text-xs mt-0.5">
                    {deal.rep === "vendasta" ? "Yes" : "No"}
                  </p>
                </div>
                <div className="bg-navy/50 rounded-lg px-3 py-2.5">
                  <p className="text-muted text-[10px] uppercase tracking-wider">Persona</p>
                  <p className="text-white text-xs mt-0.5">{deal.persona || "—"}</p>
                </div>
              </div>
            </DrawerSection>

            {/* Footer: Open in HubSpot */}
            <div className="pt-4 border-t border-border">
              <a
                href={hubspotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-navy/50 border border-border text-blue text-sm font-medium py-2.5 rounded-lg hover:bg-navy hover:border-blue/30 transition-colors"
              >
                &#x1F517; Open in HubSpot
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Research Panel overlay */}
      {showResearch && (
        <ResearchPanel deal={deal} onClose={() => setShowResearch(false)} />
      )}

      {/* Outreach toast */}
      {outreachToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-center whitespace-nowrap"
          style={{
            background: "#2ECC8A",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 999,
          }}
        >
          {outreachToast}
        </div>
      )}

      {/* Deep Research toast — fixed bottom center */}
      {researchToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-center whitespace-nowrap"
          style={{
            background: "#2ECC8A",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 999,
          }}
        >
          ✅ Research trigger copied — paste into Claude
        </div>
      )}
    </>
  );
}
