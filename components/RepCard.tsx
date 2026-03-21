"use client";

import { useRouter } from "next/navigation";
import type { RepConfig } from "@/lib/reps";
import { REP_PHOTOS } from "@/lib/repPhotos";
import FlagBadge from "./FlagBadge";
import RepStatTile from "./RepStatTile";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";

interface RepCardProps {
  config: RepConfig;
  dealCount: number;
  pipelineVal: number;
  booked: BookedByRepMonth;
  targets: TargetsByRepMonth;
  currentMonth: string;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: () => void;
}

function formatShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val === 0) return "—";
  return `$${val.toFixed(0)}`;
}

function achievedColor(pct: number): string {
  if (pct >= 80) return "text-green";
  if (pct >= 50) return "text-amber";
  return "text-orange";
}

function getWorkingDaysRemaining(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = now.getDate() + 1; d <= lastDay; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function getMonthNames() {
  const now = new Date();
  const currentMonthLong = now.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthLong = nextMonthDate.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const nextMonthShort = nextMonthDate.toLocaleString("en-US", { month: "short" });
  return { currentMonthLong, nextMonthLong, nextMonthShort };
}

export default function RepCard({
  config,
  dealCount,
  pipelineVal,
  booked,
  targets,
  currentMonth,
  selected = false,
  dimmed = false,
  onSelect,
}: RepCardProps) {
  const router = useRouter();

  const repBooked = booked[config.key] || {};
  const repTargets = targets[config.key] || {};

  // Current month stats
  const curBooked = repBooked[currentMonth] || 0;
  const curTarget = repTargets[currentMonth] || 0;
  const curAtt = curTarget > 0 ? Math.round((curBooked / curTarget) * 100) : 0;

  // Next month stats
  const { currentMonthLong, nextMonthLong, nextMonthShort } = getMonthNames();
  const nxtBooked = repBooked[nextMonthShort] || 0;
  const nxtTarget = repTargets[nextMonthShort] || 0;
  const nxtAtt = nxtTarget > 0 ? Math.round((nxtBooked / nxtTarget) * 100) : 0;

  // Q1 booked (Jan + Feb + Mar)
  const q1Months = ["Jan", "Feb", "Mar"];
  const q1Booked = q1Months.reduce((sum, m) => sum + (repBooked[m] || 0), 0);

  const daysRemain = getWorkingDaysRemaining();

  const isRamp = config.isRamp;
  const hasData = curBooked > 0 || curTarget > 0 || nxtBooked > 0 || nxtTarget > 0;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      router.push(`/dashboard/${config.key}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-card rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col"
      style={{
        border: selected ? "2px solid #4FA3D1" : "1px solid var(--border)",
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      {/* Top gradient strip */}
      <div
        className="h-2"
        style={{
          background: `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`,
        }}
      />

      {/* Photo + name */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div
            className="w-[62px] h-[62px] rounded-full border-[3px] overflow-hidden flex items-center justify-center relative"
            style={{
              borderColor: config.borderColor,
              backgroundColor: config.key === "vendasta" ? "#FFFFFF" : "#1C2F4A",
            }}
          >
            {(REP_PHOTOS[config.key] || config.photo) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={REP_PHOTOS[config.key] || config.photo}
                alt=""
                className={`w-full h-full relative z-10 ${config.key === "vendasta" ? "object-contain p-1.5" : "object-cover"}`}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : null}
            <span className="text-xl font-bold text-muted absolute inset-0 flex items-center justify-center z-0">
              {config.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </span>
          </div>
          {config.flag && <FlagBadge country={config.flag} />}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{config.name}</p>
          <p className="text-muted text-xs truncate">{config.role}</p>
          <p className="text-muted text-[10px] mt-0.5">
            {dealCount} deal{dealCount !== 1 ? "s" : ""} &middot;{" "}
            {formatShort(pipelineVal)} pipeline
          </p>
        </div>
      </div>

      {/* Scorecard tiles — 2 rows */}
      <div className="px-4 pb-4 mt-auto flex flex-col gap-3">
        {/* ROW 1 — Current month */}
        <div>
          <p
            className="text-center font-bold uppercase mb-1.5"
            style={{ fontSize: 11, color: "#FF4A2D", letterSpacing: 1 }}
          >
            {currentMonthLong}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <RepStatTile
              label="Booked"
              value={hasData ? formatShort(curBooked) : "—"}
              color={curBooked > 0 ? "text-orange" : "text-muted"}
            />
            <RepStatTile
              label="Target"
              value={hasData ? formatShort(curTarget) : "—"}
              color="text-white"
            />
            <RepStatTile
              label="Achieved"
              value={isRamp && !hasData ? "Ramping" : (hasData && curTarget > 0 ? `${curAtt}%` : "—")}
              color={isRamp && !hasData ? "text-amber" : (hasData && curTarget > 0 ? achievedColor(curAtt) : "text-muted")}
            />
            <RepStatTile
              label="Days Rem"
              value={`${daysRemain}`}
              color="text-white"
            />
          </div>
        </div>

        {/* ROW 2 — Next month */}
        <div>
          <p
            className="text-center font-bold uppercase mb-1.5"
            style={{ fontSize: 11, color: "#FF4A2D", letterSpacing: 1 }}
          >
            {nextMonthLong}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <RepStatTile
              label="Booked"
              value={nxtBooked > 0 ? formatShort(nxtBooked) : "—"}
              color={nxtBooked > 0 ? "text-orange" : "text-muted"}
            />
            <RepStatTile
              label="Target"
              value={nxtTarget > 0 ? formatShort(nxtTarget) : "—"}
              color="text-white"
            />
            <RepStatTile
              label="Achieved"
              value={nxtTarget > 0 ? `${nxtAtt}%` : "—"}
              color={nxtTarget > 0 ? achievedColor(nxtAtt) : "text-muted"}
            />
            <RepStatTile
              label="Q1 Bkd"
              value={q1Booked > 0 ? formatShort(q1Booked) : "—"}
              color={q1Booked > 0 ? "text-green" : "text-muted"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
