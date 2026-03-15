"use client";

import { useEffect, useState, useCallback } from "react";
import type { ParsedDeal } from "@/lib/hubspot";
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

export default function DealDrawer({ deal, onClose }: DealDrawerProps) {
  // --- Log to HubSpot state ---
  const [logText, setLogText] = useState("");
  const [logOps, setLogOps] = useState<LogOp[] | null>(null);
  const [logSummary, setLogSummary] = useState("");
  const [logStatus, setLogStatus] = useState<"idle" | "parsing" | "saving" | "saved" | "error">("idle");
  const [logError, setLogError] = useState<string | null>(null);

  // --- Draft email state ---
  const [emailTone, setEmailTone] = useState<ToneKey>("warm");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // --- Research panel state ---
  const [showResearch, setShowResearch] = useState(false);

  // --- Research note state ---
  const [researchNote, setResearchNote] = useState("");
  const [researchNoteStatus, setResearchNoteStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [researchNoteError, setResearchNoteError] = useState<string | null>(null);

  // Reset all states when deal changes
  useEffect(() => {
    setLogText("");
    setLogOps(null);
    setLogSummary("");
    setLogStatus("idle");
    setLogError(null);
    setEmailTone("warm");
    setEmailSubject("");
    setEmailBody("");
    setEmailLoading(false);
    setEmailCopied(false);
    setShowResearch(false);
    setResearchNote("");
    setResearchNoteStatus("idle");
    setResearchNoteError(null);
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

  // --- 7A: Parse & Preview ---
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
      if (!res.ok) throw new Error("Parse failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLogOps(data.ops || []);
      setLogSummary(data.summary || "");
      setLogStatus("idle");
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Parse failed");
      setLogStatus("error");
    }
  }, [logText, deal]);

  // --- 7A: Confirm & execute ---
  const handleConfirmLog = useCallback(async () => {
    if (!deal || !logOps) return;
    setLogStatus("saving");
    setLogError(null);
    try {
      // Execute property updates
      const propUpdates: Record<string, string> = {};
      const notes: string[] = [];

      for (const op of logOps) {
        if (op.type === "add_note") {
          notes.push(op.hubspotValue);
        } else if (op.hubspotProperty) {
          propUpdates[op.hubspotProperty] = op.hubspotValue;
        }
      }

      // PATCH deal properties if any
      if (Object.keys(propUpdates).length > 0) {
        const patchRes = await fetch(`/api/hubspot/deal/${deal.id}/update`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ properties: propUpdates }),
        });
        if (!patchRes.ok) throw new Error("Failed to update deal properties");
      }

      // POST notes if any
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

  // --- 7B: Generate email ---
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
      if (!res.ok) throw new Error("Email generation failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmailSubject(data.subject || "");
      setEmailBody(data.body || "");
    } catch {
      setEmailSubject("Error generating email");
      setEmailBody("Please try again or draft manually.");
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

  const handleAddResearchNote = useCallback(async () => {
    if (!deal || !researchNote.trim()) return;
    setResearchNoteStatus("saving");
    setResearchNoteError(null);
    try {
      const res = await fetch(`/api/hubspot/deal/${deal.id}/research-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: researchNote.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save research note");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResearchNoteStatus("saved");
      setResearchNote("");
    } catch (err) {
      setResearchNoteError(err instanceof Error ? err.message : "Save failed");
      setResearchNoteStatus("error");
    }
  }, [deal, researchNote]);

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
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-navy/50 hover:bg-navy flex items-center justify-center text-muted hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <DrawerHero deal={deal} />

          <div className="px-6 pb-6">
            {/* Section 1: Next Action */}
            <DrawerSection title="Next Action">
              <div className="flex gap-2">
                <button className="flex-1 bg-blue hover:bg-blue/80 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors">
                  {deal.action1}
                </button>
                <button className="flex-1 bg-navy/50 hover:bg-navy border border-border text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors">
                  {deal.action2}
                </button>
              </div>
              {/* AI Research button in action area */}
              {deal.hasResearch && (
                <button
                  onClick={() => setShowResearch(true)}
                  className="mt-2 w-full bg-[#7C3AED]/15 text-[#7C3AED] text-sm font-medium py-2 rounded-lg hover:bg-[#7C3AED]/25 transition-colors flex items-center justify-center gap-2"
                >
                  <span>&#10022;</span> View Research Brief
                </button>
              )}
            </DrawerSection>

            {/* Section 2: Log to HubSpot (7A) */}
            <DrawerSection title="Log to HubSpot">
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
                    "Parse & Preview"
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
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleConfirmLog}
                      disabled={logStatus === "saving"}
                      className="bg-green/20 text-green text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green/30 transition-colors disabled:opacity-50"
                    >
                      {logStatus === "saving" ? "Saving..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => { setLogOps(null); setLogSummary(""); setLogStatus("idle"); }}
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

            {/* Section 3: Draft Client Email (7B) */}
            <DrawerSection title="Draft Client Email">
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
                  <>
                    <span>&#10022;</span> Generate Email
                  </>
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

            {/* Section 4: Add Research Note */}
            <DrawerSection title="Add Research Note">
              <textarea
                value={researchNote}
                onChange={(e) => setResearchNote(e.target.value)}
                placeholder="Add research notes, meeting outcomes, or intel to the deal record..."
                className="w-full bg-navy/50 border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-muted resize-none focus:outline-none focus:border-blue"
                rows={3}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleAddResearchNote}
                  disabled={!researchNote.trim() || researchNoteStatus === "saving"}
                  className="bg-[#7C3AED]/20 text-[#7C3AED] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#7C3AED]/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {researchNoteStatus === "saving" ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Append to Deal"
                  )}
                </button>
                {researchNoteStatus === "saved" && (
                  <span className="text-green text-xs">Note saved to HubSpot</span>
                )}
                {researchNoteError && (
                  <span className="text-orange text-xs">{researchNoteError}</span>
                )}
              </div>
            </DrawerSection>

            {/* Section 5: MEDDIC */}
            <DrawerSection title="MEDDIC">
              <MeddicGrid meddic={deal.meddic} />
            </DrawerSection>

            {/* Section 5: Contacts */}
            <DrawerSection title="Contacts">
              <ContactsList contacts={deal.contacts} />
            </DrawerSection>

            {/* Section 6: Document Status */}
            <DrawerSection title="Document Status">
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
            <DrawerSection title="Deal Details">
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

            {/* Open in HubSpot */}
            <div className="pt-4 border-t border-border">
              <a
                href={hubspotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-navy/50 border border-border text-blue text-sm font-medium py-2.5 rounded-lg hover:bg-navy hover:border-blue/30 transition-colors"
              >
                Open in HubSpot
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 7C: Research Panel (full-screen over drawer) */}
      {showResearch && (
        <ResearchPanel deal={deal} onClose={() => setShowResearch(false)} />
      )}
    </>
  );
}
