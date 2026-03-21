"use client";

interface RepStatTileProps {
  label: string;
  value: string;
  color?: string;
}

export default function RepStatTile({ label, value, color = "text-white" }: RepStatTileProps) {
  return (
    <div className="bg-navy/50 rounded-lg" style={{ padding: "4px 6px", overflow: "visible", minWidth: 0 }}>
      <p style={{ fontSize: 8, color: "#6B7F96", lineHeight: 1.3, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {label}
      </p>
      <p className={`font-semibold ${color}`} style={{ fontSize: 12, lineHeight: 1.3, whiteSpace: "nowrap" }}>
        {value}
      </p>
    </div>
  );
}
