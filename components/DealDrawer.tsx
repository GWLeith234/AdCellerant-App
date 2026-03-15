"use client";

import { useEffect, useState, useCallback } from "react";
import type { ParsedDeal } from "@/lib/hubspot";
import DrawerHero from "./DrawerHero";
import DrawerSection from "./DrawerSection";
import MeddicGrid from "./MeddicGrid";
import ContactsList from "./ContactsList";
import DocStatusGrid from "./DocStatusGrid";

interface DealDrawerProps {
  deal: ParsedDeal | null;
  onClose: () => void;
}

const HUBSPOT_PORTAL = "47345959";

const TONE_OPTIONS = [
  { key: "professional", label: "Professional" },
  { key: "friendly", label: "Friendly" },
  { key: "urgent", label: "Urgent" },
  { key: "followup", label: "Follow-up" },
  { key: "closing", label: "Closing" },
] as const;

type ToneKey = (typeof TONE_OPTIONS)[number]["key"];

interface LogPreviewRow {
  change: string;
  current: string;
  newVal: string;
}

export default function DealDrawer({ deal, onClose }: DealDrawerProps) {
  // --- State for all AI/action panels ---
  const [logText, setLogText] = useState("");
  const [logPreview, setLogPreview] = useState<LogPreviewRow[] | null>(null);
  const [logStatus, setLogStatus] = useState<"idle" | "parsing" | "saving" | "saved" | "error">("idle");
  const [logError, setLogError] = useState<string | null>(null);

  const [emailTone, setEmailTone] = useState<ToneKey>("professional");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Reset all states when deal changes
  useEffect(() => {
    setLogText("");
    setLogPreview(null);
    setLogStatus("idle");
    setLogError(null);
    setEmailTone("professional");
    setEmailSubject("");
    setEmailBody("");
    setEmailLoading(false);
    setEmailCopied(false);
  }, [deal?.id]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (deal) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [deal, onClose]);

  const handleParsePreview = useCallback(async () => {
    if (!logText.trim() || !deal) return;
    setLogStatus("parsing");
    setLogError(null);
    try {
      // Simple client-side parsing of log text into preview rows
      const lines = logText.trim().split("\n").filter(Boolean);
      const rows: LogPreviewRow[] = lines.map((line) => {
        const parts = line.split(":").map((s) => s.trim());
        return {
          change: parts[0] || line,
          current: "—",
          newVal: parts.slice(1).join(":").trim() || line,
        };
      });
      setLogPreview(rows);
      setLogStatus("idle");
    } catch {
      setLogError("Failed to parse log entry");
      setLogStatus("error");
    }
  }, [logText, deal]);

  const handleConfirmLog = useCallback(async () => {
    if (!deal) return;
    setLogStatus("saving");
    setLogError(null);
    try {
      const res = await fetch(`/api/hubspot/deal/${deal.id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: logText }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      setLogStatus("saved");
      setLogText("");
      setLogPreview(null);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Save failed");
      setLogStatus("error");
    }
  }, [deal, logText]);

  const handleGenerateEmail = useCallback(async () => {
    if (!deal) return;
    setEmailLoading(true);
    try {
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealName: deal.name,
          dealSub: deal.sub,
          persona: deal.persona,
          stage: deal.stage,
          contacts: deal.contacts,
          tone: emailTone,
          val: deal.valShort,
        }),
      });
      if (!res.ok) throw new Error("Email generation failed");
      const data = await res.json();
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

  if (!deal) return null;

  const hubspotUrl = `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL}/record/0-3/${deal.hsId}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-card z-50 shadow-2xl flex flex-col animate-slide-in">
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
          {/* Hero */}
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
            </DrawerSection>

            {/* Section 2: Log to HubSpot */}
            <DrawerSection title="Log to HubSpot">
              <textarea
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="Enter notes to log to this deal..."
                className="w-full bg-navy/50 border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-muted resize-none focus:outline-none focus:border-blue"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleParsePreview}
                  disabled={!logText.trim() || logStatus === "parsing"}
                  className="bg-amber/20 text-amber text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber/30 transition-colors disabled:opacity-50"
                >
                  Parse & Preview
                </button>
              </div>

              {logPreview && (
                <div className="mt-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted">
                        <th className="text-left py-1 font-medium">Change</th>
                        <th className="text-left py-1 font-medium">Current</th>
                        <th className="text-left py-1 font-medium">New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logPreview.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="py-1.5 text-white">{row.change}</td>
                          <td className="py-1.5 text-muted">{row.current}</td>
                          <td className="py-1.5 text-green">{row.newVal}</td>
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
                      onClick={() => { setLogPreview(null); setLogStatus("idle"); }}
                      className="bg-navy/50 text-muted text-xs font-medium px-3 py-1.5 rounded-lg hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {logStatus === "saved" && (
                <p className="text-green text-xs mt-2">Note saved to HubSpot</p>
              )}
              {logError && (
                <p className="text-orange text-xs mt-2">{logError}</p>
              )}
            </DrawerSection>

            {/* Section 3: Draft Client Email */}
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

            {/* Section 4: MEDDIC */}
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
    </>
  );
}
