"use client";

import { useRouter } from "next/navigation";
import type { RepConfig } from "@/lib/reps";
import { REP_PHOTOS } from "@/lib/repPhotos";
import FlagBadge from "./FlagBadge";

interface RepHeaderProps {
  config: RepConfig;
}

export default function RepHeader({ config }: RepHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 mb-4">
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
            className="w-[52px] h-[52px] rounded-full border-[3px] overflow-hidden flex items-center justify-center relative"
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
                className={`w-full h-full relative z-10 ${config.key === "vendasta" ? "object-contain p-1" : "object-cover"}`}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : null}
            <span className="text-lg font-bold text-muted absolute inset-0 flex items-center justify-center z-0">
              {config.name.split(" ").map((w) => w[0]).join("")}
            </span>
          </div>
          {config.flag && <FlagBadge country={config.flag} size={18} />}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-base truncate">{config.name}</p>
          <p className="text-muted text-xs truncate">{config.role}</p>
        </div>
      </div>
    </div>
  );
}
