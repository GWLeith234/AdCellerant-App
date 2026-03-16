"use client";

interface AnnualRailProps {
  ytdBooked: number;
  annualTarget: number;
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
  if (val === 0) return "—";
  return `$${val.toFixed(0)}`;
}

export default function AnnualRail({ ytdBooked, annualTarget, isRamp }: AnnualRailProps) {
  const hasData = ytdBooked > 0 || annualTarget > 0;
  const pct = annualTarget > 0 ? Math.min((ytdBooked / annualTarget) * 100, 100) : 0;
  const gap = annualTarget > 0 ? Math.max(annualTarget - ytdBooked, 0) : 0;

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <p className="text-muted text-[10px] uppercase tracking-wider">Annual</p>
          <span className="text-white text-sm font-semibold">{formatShort(ytdBooked)}</span>
          <span className="text-muted text-[11px]">YTD of {formatShort(annualTarget)}</span>
        </div>
        <div className="flex items-center gap-3">
          {isRamp && annualTarget === 0 ? (
            <span className="text-amber text-xs font-semibold">Ramp</span>
          ) : !hasData ? (
            <span className="text-muted text-xs font-semibold">—</span>
          ) : (
            <span className={`text-xs font-semibold ${ragText(pct)}`}>
              {Math.round(pct)}% att
            </span>
          )}
          {gap > 0 && annualTarget > 0 && (
            <span className="text-orange text-[10px] font-medium">
              {formatShort(gap)} gap
            </span>
          )}
        </div>
      </div>

      {/* Thin rail */}
      <div className="h-1.5 bg-navy/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${ragBg(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
