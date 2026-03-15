"use client";

import { useRouter } from "next/navigation";
import type { RepConfig } from "@/lib/reps";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";
import FlagBadge from "./FlagBadge";
import ArcCard from "./ArcCard";
import BarCard from "./BarCard";
import AnnualRail from "./AnnualRail";

interface ScorecardStripProps {
  config: RepConfig;
  booked: BookedByRepMonth;
  targets: TargetsByRepMonth;
}

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ScorecardStrip({ config, booked, targets }: ScorecardStripProps) {
  const router = useRouter();
  const repBooked = booked[config.key] || {};
  const repTargets = targets[config.key] || {};
  const isRamp = config.isRamp;

  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });
  const currentMonthIdx = ALL_MONTHS.indexOf(currentMonth);
  const nextMonth = currentMonthIdx < 11 ? ALL_MONTHS[currentMonthIdx + 1] : ALL_MONTHS[0];

  // Current month
  const marBooked = repBooked[currentMonth] || 0;
  const marTarget = repTargets[currentMonth] || 0;

  // Next month
  const aprBooked = repBooked[nextMonth] || 0;
  const aprTarget = repTargets[nextMonth] || 0;

  // Q1
  const q1Months = ["Jan", "Feb", "Mar"];
  const q1Booked = q1Months.reduce((sum, m) => sum + (repBooked[m] || 0), 0);
  const q1Target = q1Months.reduce((sum, m) => sum + (repTargets[m] || 0), 0);

  // Annual YTD
  const ytdMonths = ALL_MONTHS.slice(0, currentMonthIdx + 1);
  const ytdBooked = ytdMonths.reduce((sum, m) => sum + (repBooked[m] || 0), 0);
  const annualTarget = ALL_MONTHS.reduce((sum, m) => sum + (repTargets[m] || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header strip: photo + name + back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-muted hover:text-white text-sm transition-colors flex items-center gap-1 flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All reps
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className="w-[52px] h-[52px] rounded-full border-[3px] overflow-hidden bg-navy flex items-center justify-center"
              style={{ borderColor: config.borderColor }}
            >
              {config.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.photo}
                  alt={config.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-muted">
                  {config.name.split(" ").map((w) => w[0]).join("")}
                </span>
              )}
            </div>
            {config.flag && <FlagBadge country={config.flag} size={18} />}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-base truncate">{config.name}</p>
            <p className="text-muted text-xs truncate">{config.role}</p>
          </div>
        </div>
      </div>

      {/* Scorecard BI grid: 3-panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left: Arc card — current month attainment */}
        <ArcCard
          label={`${currentMonth} Attainment`}
          booked={marBooked}
          target={marTarget}
          isRamp={isRamp}
        />

        {/* Right column: two bar cards stacked */}
        <div className="flex flex-col gap-3 md:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <BarCard
              label={nextMonth}
              booked={aprBooked}
              target={aprTarget}
              isRamp={isRamp}
            />
            <BarCard
              label="Q1"
              booked={q1Booked}
              target={q1Target}
              isRamp={isRamp}
            />
          </div>
        </div>
      </div>

      {/* Annual rail — full width */}
      <AnnualRail
        ytdBooked={ytdBooked}
        annualTarget={annualTarget}
        isRamp={isRamp}
      />
    </div>
  );
}
