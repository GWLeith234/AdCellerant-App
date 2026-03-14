"use client";

import { useRouter } from "next/navigation";
import FlagBadge from "./FlagBadge";
import RepStatTile from "./RepStatTile";
import type { BookedByRepMonth, TargetsByRepMonth } from "@/lib/types";

export interface RepConfig {
  key: string;
  name: string;
  role: string;
  photo: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  flag?: "ca" | "uk";
  isRamp?: boolean;
}

interface RepCardProps {
  config: RepConfig;
  dealCount: number;
  pipelineVal: number;
  booked: BookedByRepMonth;
  targets: TargetsByRepMonth;
  currentMonth: string;
}

function formatShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val === 0) return "—";
  return `$${val.toFixed(0)}`;
}

function ragColor(pct: number): string {
  if (pct >= 100) return "text-green";
  if (pct >= 75) return "text-amber";
  return "text-orange";
}

export default function RepCard({
  config,
  dealCount,
  pipelineVal,
  booked,
  targets,
  currentMonth,
}: RepCardProps) {
  const router = useRouter();

  const repBooked = booked[config.key] || {};
  const repTargets = targets[config.key] || {};

  // Current month stats
  const marBooked = repBooked[currentMonth] || 0;
  const marTarget = repTargets[currentMonth] || 0;
  const marAtt = marTarget > 0 ? Math.round((marBooked / marTarget) * 100) : 0;

  // Q1 booked (Jan + Feb + Mar)
  const q1Months = ["Jan", "Feb", "Mar"];
  const q1Booked = q1Months.reduce((sum, m) => sum + (repBooked[m] || 0), 0);

  // Ramp stats for Alex
  const isRamp = config.isRamp;

  return (
    <div
      onClick={() => router.push(`/dashboard/${config.key}`)}
      className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-blue/50 transition-colors flex flex-col"
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
            className="w-[62px] h-[62px] rounded-full border-[3px] overflow-hidden bg-navy flex items-center justify-center"
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
              <span className="text-xl font-bold text-muted">
                {config.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </span>
            )}
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

      {/* Stat tiles 2x2 */}
      <div className="px-4 pb-4 mt-auto">
        {isRamp ? (
          <div className="grid grid-cols-2 gap-2">
            <RepStatTile label="Ramp" value="Active" color="text-amber" />
            <RepStatTile label="Ann Tgt" value={formatShort(repTargets["Annual"] || 0)} color="text-white" />
            <RepStatTile label="UK%" value="—" color="text-blue" />
            <RepStatTile label="1st Deal" value="Pending" color="text-muted" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <RepStatTile
              label="Mar Booked"
              value={formatShort(marBooked)}
              color={marBooked > 0 ? "text-green" : "text-muted"}
            />
            <RepStatTile
              label="Mar Target"
              value={formatShort(marTarget)}
              color="text-white"
            />
            <RepStatTile
              label="Mar Att"
              value={marTarget > 0 ? `${marAtt}%` : "—"}
              color={marTarget > 0 ? ragColor(marAtt) : "text-muted"}
            />
            <RepStatTile
              label="Q1 Booked"
              value={formatShort(q1Booked)}
              color={q1Booked > 0 ? "text-green" : "text-muted"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
