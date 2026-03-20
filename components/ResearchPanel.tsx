"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { ParsedDeal } from "@/lib/hubspot";

interface ResearchData {
  sections: Record<string, string>;
  rawText?: string;
}

interface ResearchPanelProps {
  deal: ParsedDeal;
  onClose: () => void;
}

const SECTION_ORDER = [
  "ACCOUNT INTELLIGENCE",
  "STAKEHOLDER READ",
  "MEDDIC ANALYSIS",
  "STAGE RISK ASSESSMENT",
  "RECOMMENDED NEXT MOVE",
  "OPEN QUESTIONS",
];

// Session cache: keyed by deal id
const sessionCache = new Map<string, ResearchData>();

export default function ResearchPanel({ deal, onClose }: ResearchPanelProps) {
  const [data, setData] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchResearch = useCallback(
    async (forceRefresh = false) => {
      // Check session cache first
      if (!forceRefresh && sessionCache.has(deal.id)) {
        setData(sessionCache.get(deal.id)!);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/research-synthesis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deal }),
        });
        const result = await res.json();
        if (!res.ok || result.error) {
          const msg = result.error?.includes("not configured")
            ? "AI features require ANTHROPIC_API_KEY to be set in Railway. Contact George to configure."
            : result.error || "Research synthesis failed";
          throw new Error(msg);
        }
        sessionCache.set(deal.id, result);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load research");
      } finally {
        setLoading(false);
      }
    },
    [deal]
  );

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchResearch();
    }
  }, [fetchResearch]);

  return (
    <>
      {/* Panel backdrop */}
      <div className="fixed inset-0 bg-black/70 z-[60]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-card rounded-2xl z-[61] flex flex-col shadow-2xl border border-[#7C3AED]/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-[#7C3AED] text-lg">&#10022;</span>
            <div>
              <h2 className="text-white font-semibold text-base">Research Brief</h2>
              <p className="text-muted text-xs">{deal.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchResearch(true)}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-navy/50 hover:bg-navy flex items-center justify-center text-muted hover:text-white transition-colors disabled:opacity-50"
              title="Refresh research"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={loading ? "animate-spin" : ""}>
                <path d="M1 7a6 6 0 0111.2-3M13 7a6 6 0 01-11.2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12.2 1v3h-3M1.8 13v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-navy/50 hover:bg-navy flex items-center justify-center text-muted hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 pb-8">
          {/* Loading state: pulsing purple orb */}
          {loading && !data && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-full bg-[#7C3AED]/20 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 rounded-full bg-[#7C3AED]/40 flex items-center justify-center animate-pulse">
                  <span className="text-[#7C3AED] text-xl">&#10022;</span>
                </div>
              </div>
              <p className="text-muted text-sm">Synthesizing research brief...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-orange text-sm">{error}</p>
              <button
                onClick={() => fetchResearch(true)}
                className="bg-[#7C3AED]/20 text-[#7C3AED] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#7C3AED]/30 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Research sections */}
          {data && data.sections && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECTION_ORDER.map((header) => {
                const content = data.sections[header];
                if (!content) return null;
                return (
                  <div
                    key={header}
                    className="bg-navy/30 rounded-xl border border-border overflow-hidden"
                  >
                    <div className="bg-[#7C3AED]/10 px-4 py-2.5 border-b border-[#7C3AED]/20">
                      <h3
                        className="text-[#7C3AED] text-xs font-semibold tracking-wider"
                        style={{ fontFamily: "var(--font-orbitron, monospace)", textTransform: "uppercase" }}
                      >
                        {header}
                      </h3>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[#F0F4F8] text-[13px] leading-[1.6] whitespace-pre-wrap">
                        {content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading overlay when refreshing with existing data */}
          {loading && data && (
            <div className="mt-4 text-center">
              <p className="text-muted text-xs flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                Refreshing...
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
