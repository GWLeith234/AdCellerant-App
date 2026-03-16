"use client";

import WorldClock from "./WorldClock";

export default function Topbar() {
  return (
    <header
      className="sticky top-0 z-[100] border-b border-border px-3 sm:px-5 flex items-center"
      style={{ backgroundColor: "#0B1624", height: 56 }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Left: logo + brand */}
        <div className="flex items-center gap-3">
          {/* AdCellerant combined logo (flame icon + wordmark) */}
          <img
            src="/logos/adcellerant-logo.png"
            alt="AdCellerant"
            style={{ height: 36, width: "auto", mixBlendMode: "screen" }}
          />

          {/* Divider */}
          <div className="w-px h-7 bg-white/15 mx-1" />

          {/* Globe + brand text */}
          <span style={{ fontSize: 28, lineHeight: 1 }}>🌍</span>
          <div className="flex flex-col justify-center">
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#FF4A2D",
                letterSpacing: "0.04em",
                lineHeight: 1.1,
              }}
            >
              COMMAND
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "#FF4A2D",
                letterSpacing: "0.12em",
                lineHeight: 1.3,
              }}
            >
              CENTER
            </span>
          </div>
        </div>

        {/* Right: clocks */}
        <div className="hidden sm:flex items-center gap-6">
          <WorldClock label="London" timezone="Europe/London" />
          <WorldClock label="Saskatoon" timezone="America/Regina" />
          <WorldClock label="Denver" timezone="America/Denver" />
        </div>
      </div>
    </header>
  );
}
