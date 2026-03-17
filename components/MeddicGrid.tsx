"use client";

import { useState } from "react";
import type { MeddicScore, MeddicNotes } from "@/lib/hubspot";

interface MeddicGridProps {
  meddic: MeddicScore;
  meddicNotes?: MeddicNotes;
  onNoteUpdate?: (field: keyof MeddicScore, note: string) => void;
}

const MEDDIC_LABELS: Record<keyof MeddicScore, string> = {
  metrics: "Metrics",
  econBuyer: "Economic Buyer",
  decisionCriteria: "Decision Criteria",
  decisionProcess: "Decision Process",
  identifyPain: "Identify Pain",
  champion: "Champion",
};

function statusEmoji(val: string): string {
  if (!val) return "❌";
  const v = val.toLowerCase();
  if (v === "ok" || v === "yes" || v === "done" || v === "complete") return "✅";
  if (v === "partial" || v === "wip" || v === "started" || v === "in progress") return "⚠️";
  return "❌";
}

function statusLabel(val: string): string {
  if (!val) return "Gap";
  const v = val.toLowerCase();
  if (v === "ok" || v === "yes" || v === "done" || v === "complete") return "Confirmed";
  if (v === "partial" || v === "wip" || v === "started" || v === "in progress") return "Partial";
  return "Gap";
}

function borderColor(val: string): string {
  if (!val) return "#FF4A2D";
  const v = val.toLowerCase();
  if (v === "ok" || v === "yes" || v === "done" || v === "complete") return "#2ECC8A";
  if (v === "partial" || v === "wip" || v === "started" || v === "in progress") return "#F5A623";
  return "#FF4A2D";
}

function isGap(val: string): boolean {
  if (!val) return true;
  const v = val.toLowerCase();
  return v === "gap" || v === "no" || v === "missing" || v === "";
}

export default function MeddicGrid({ meddic, meddicNotes, onNoteUpdate }: MeddicGridProps) {
  const entries = Object.entries(meddic) as [keyof MeddicScore, string][];
  const [expandedField, setExpandedField] = useState<keyof MeddicScore | null>(null);
  const [editingField, setEditingField] = useState<keyof MeddicScore | null>(null);
  const [editText, setEditText] = useState("");

  const handleStartEdit = (field: keyof MeddicScore) => {
    setEditingField(field);
    setEditText(meddicNotes?.[field] || "");
  };

  const handleSave = (field: keyof MeddicScore) => {
    onNoteUpdate?.(field, editText);
    setEditingField(null);
    setEditText("");
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([key, val]) => {
        const note = meddicNotes?.[key] || "";
        const gap = isGap(val);
        const expanded = expandedField === key;
        const editing = editingField === key;

        return (
          <div
            key={key}
            className="bg-navy/50 rounded-lg px-3 py-2.5 border-l-[3px]"
            style={{ borderLeftColor: borderColor(val) }}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p className="text-muted" style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {MEDDIC_LABELS[key]}
              </p>
              <span style={{ fontSize: 10 }}>
                {statusEmoji(val)} <span style={{ fontSize: 9, color: "#6B7F96" }}>{statusLabel(val)}</span>
              </span>
            </div>

            {/* Content area */}
            {gap && !editing ? (
              /* Gap — show add prompt */
              <button
                onClick={() => handleStartEdit(key)}
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: "#FF4A2D",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                Add {MEDDIC_LABELS[key].toLowerCase()} →
              </button>
            ) : note && !editing ? (
              /* Has note — show it */
              <p
                onClick={() => setExpandedField(expanded ? null : key)}
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: "#F0F4F8",
                  lineHeight: 1.4,
                  cursor: "pointer",
                  display: "-webkit-box",
                  WebkitLineClamp: expanded ? undefined : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: expanded ? "visible" : "hidden",
                }}
              >
                {note}
              </p>
            ) : !editing ? (
              /* ok/partial but no note */
              <p style={{ marginTop: 4, fontSize: 10, color: "#6B7F96", fontStyle: "italic" }}>
                No notes yet
              </p>
            ) : null}

            {/* Inline edit */}
            {editing && (
              <div style={{ marginTop: 4 }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="e.g. CFO confirmed $50K budget Q1"
                  autoFocus
                  style={{
                    width: "100%",
                    fontSize: 10,
                    color: "#F0F4F8",
                    background: "#0D1B2E",
                    border: "0.5px solid #2A3F5C",
                    borderRadius: 4,
                    padding: "4px 6px",
                    resize: "none",
                    outline: "none",
                    lineHeight: 1.4,
                  }}
                  rows={2}
                />
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <button
                    onClick={() => handleSave(key)}
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#2ECC8A",
                      background: "rgba(46,204,138,0.15)",
                      border: "0.5px solid rgba(46,204,138,0.3)",
                      borderRadius: 4,
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingField(null); setEditText(""); }}
                    style={{
                      fontSize: 9,
                      fontWeight: 500,
                      color: "#6B7F96",
                      background: "none",
                      border: "0.5px solid #2A3F5C",
                      borderRadius: 4,
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
