"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import WorldClock from "./WorldClock";
import { useRevenueData } from "@/lib/RevenueDataContext";

export default function Topbar() {
  const { dataSource, hasRevenueData } = useRevenueData();
  const [hubspotLive, setHubspotLive] = useState(false);

  // Check HubSpot status once
  useEffect(() => {
    fetch("/api/hubspot/deals")
      .then((res) => res.json())
      .then((data) => setHubspotLive(!data.mock))
      .catch(() => setHubspotLive(false));
  }, []);

  // Status pill logic
  let pillLabel: string;
  let pillColor: string;
  if (hubspotLive) {
    pillLabel = "● Live";
    pillColor = "text-green bg-green/10 border-green/30";
  } else if (hasRevenueData && dataSource === "csv") {
    pillLabel = "✓ Data";
    pillColor = "text-green bg-green/10 border-green/30";
  } else {
    pillLabel = "⚠ Mock";
    pillColor = "text-amber bg-amber/10 border-amber/30";
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-border flex items-center"
      style={{ backgroundColor: "#0B1624", height: 56, padding: "0 20px" }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Left: logo + divider + globe + brand */}
        <div className="flex items-center">
          <Image
            src="/logos/AdC_Logo_RGB_Inverse_copy.png"
            alt="AdCellerant"
            width={160}
            height={38}
            style={{ mixBlendMode: "screen" }}
            priority
          />

          {/* Vertical divider */}
          <div style={{ width: 1, height: 28, background: "#2A3F5C", margin: "0 12px" }} />

          {/* Globe + brand text */}
          <span style={{ fontSize: 28, lineHeight: 1 }}>🌍</span>
          <div className="flex flex-col justify-center" style={{ marginLeft: 8 }}>
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

        {/* Right: admin link + status pill + clocks */}
        <div className="hidden sm:flex items-center gap-6">
          {/* Status pill */}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${pillColor}`}>
            {pillLabel}
          </span>

          {/* Admin link */}
          <Link
            href="/admin"
            className="text-[10px] text-muted hover:text-white transition-colors"
          >
            ⚙ Admin
          </Link>

          <WorldClock label="London" timezone="Europe/London" />
          <WorldClock label="Saskatoon" timezone="America/Regina" />
          <WorldClock label="Denver" timezone="America/Denver" />
        </div>
      </div>
    </header>
  );
}
