"use client";

import WorldClock from "./WorldClock";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-5 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-2xl">🌐</span>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white leading-none">
              COMMAND <span className="text-orange">/ CENTER</span>
            </h1>
            <p className="text-muted text-xs">AdCellerant</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <WorldClock label="London" timezone="Europe/London" />
          <WorldClock label="Saskatoon" timezone="America/Regina" />
          <WorldClock label="Denver" timezone="America/Denver" />
        </div>
      </div>
    </header>
  );
}
