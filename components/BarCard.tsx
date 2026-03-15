"use client";

interface BarCardProps {
  label: string;
  booked: number;
  target: number;
  isRamp?: boolean;
}

function ragBg(pct: number): string {
  if (pct >= 100) return "bg-green";
  if (pct >= 75) return "bg-amber";
  return "bg-orange";
}

function ragText(pct: number): string {
  if (pct >= 100) return "text-green";
  if (pct >= 75) return "text-amber";
  return "text-orange";
}

function formatShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val === 0) return "$0";
  return `$${val.toFixed(0)}`;
}

export default function BarCard({ label, booked, target, isRamp }: BarCardProps) {
  const pct = target > 0 ? Math.min((booked / target) * 100, 100) : 0;
  const gap = target > 0 ? Math.max(target - booked, 0) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted text-[10px] uppercase tracking-wider">{label}</p>
        {isRamp && target === 0 ? (
          <span className="text-amber text-xs font-semibold">Ramp</span>
        ) : (
          <span className={`text-xs font-semibold ${ragText(pct)}`}>
            {Math.round(pct)}%
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-white text-sm font-semibold">{formatShort(booked)}</span>
        <span className="text-muted text-[11px]">/ {formatShort(target)}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-navy/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${ragBg(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {gap > 0 && target > 0 && (
        <p className="text-orange text-[10px] font-medium mt-1.5">
          {formatShort(gap)} gap
        </p>
      )}
    </div>
  );
}
