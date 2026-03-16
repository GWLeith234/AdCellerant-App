"use client";

interface ArcCardProps {
  label: string;
  booked: number;
  target: number;
  isRamp?: boolean;
}

function ragColor(pct: number): string {
  if (pct >= 100) return "#2ECC8A";
  if (pct >= 75) return "#F5A623";
  return "#FF4A2D";
}

function ragClass(pct: number): string {
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

export default function ArcCard({ label, booked, target, isRamp }: ArcCardProps) {
  const hasData = booked > 0 || target > 0;
  const pct = target > 0 ? Math.min((booked / target) * 100, 100) : 0;
  const gap = target > 0 ? Math.max(target - booked, 0) : 0;
  const color = ragColor(pct);

  // SVG arc parameters — clockwise from 12 o'clock
  const cx = 60;
  const cy = 60;
  const r = 48;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * r;
  // Start at 12 o'clock: rotate -90deg
  const dashOffset = circumference - (circumference * pct) / 100;

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center">
      <p className="text-muted text-[10px] uppercase tracking-wider mb-3">{label}</p>

      <div className="relative w-[120px] h-[120px]">
        <svg width="120" height="120" className="-rotate-90">
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#2A3F5C"
            strokeWidth={strokeWidth}
          />
          {/* Filled arc */}
          {target > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isRamp && target === 0 ? (
            <span className="text-amber text-lg font-bold">Ramp</span>
          ) : !hasData ? (
            <span className="text-muted text-2xl font-bold">—</span>
          ) : (
            <span className={`text-2xl font-bold ${ragClass(pct)}`}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      </div>

      <div className="text-center mt-3 space-y-0.5">
        <p className="text-white text-sm font-semibold">{formatShort(booked)}</p>
        <p className="text-muted text-[11px]">of {formatShort(target)} target</p>
        {gap > 0 && target > 0 && (
          <p className="text-orange text-[10px] font-medium">
            {formatShort(gap)} gap
          </p>
        )}
      </div>
    </div>
  );
}
