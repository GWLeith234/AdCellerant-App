"use client";

interface RepStatTileProps {
  label: string;
  value: string;
  color?: string;
}

export default function RepStatTile({ label, value, color = "text-white" }: RepStatTileProps) {
  return (
    <div className="bg-navy/50 rounded-lg px-2.5 py-2 min-w-0">
      <p className="text-muted text-[10px] uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">
        {label}
      </p>
      <p className={`text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis ${color}`}>
        {value}
      </p>
    </div>
  );
}
