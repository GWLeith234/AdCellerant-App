"use client";

import { useState } from "react";
import type { ParsedDeal } from "@/lib/hubspot";

interface ResearchRequestModalProps {
  deal: ParsedDeal;
  onClose: () => void;
}

export default function ResearchRequestModal({ deal, onClose }: ResearchRequestModalProps) {
  const [copied, setCopied] = useState(false);

  const triggerText = `New Lead — ${deal.name}${deal.persona ? `, ${deal.persona}` : ""}`;

  const [showToast, setShowToast] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(triggerText);
    setCopied(true);
    setShowToast(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[70]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[400px] max-w-[90vw] bg-card border border-border rounded-2xl shadow-2xl">
        <div className="px-6 py-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 rounded-lg bg-amber/20 flex items-center justify-center text-amber text-sm">!</span>
            <div>
              <h3 className="text-white font-semibold text-sm">Research Needed</h3>
              <p className="text-muted text-xs">{deal.name}</p>
            </div>
          </div>

          {/* Explanation */}
          <p className="text-slate text-xs mb-4">
            No research on file for this deal. Copy the trigger below to start a research request.
          </p>

          {/* Trigger text */}
          <div className="bg-navy/50 border border-border rounded-lg px-3 py-2.5 mb-4">
            <p className="text-muted text-[10px] uppercase tracking-wider mb-1">Research Trigger</p>
            <p className="text-white text-sm font-medium">{triggerText}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 bg-amber/20 text-amber text-sm font-medium py-2 rounded-lg hover:bg-amber/30 transition-colors"
            >
              {copied ? "Copied!" : "Copy Research Trigger"}
            </button>
            <button
              onClick={onClose}
              className="bg-navy/50 text-muted text-sm font-medium px-4 py-2 rounded-lg hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {/* Toast — fixed bottom center */}
      {showToast && (
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
          ✅ Trigger copied — paste it into Claude
        </div>
      )}
    </>
  );
}
