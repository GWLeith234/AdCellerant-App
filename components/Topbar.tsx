"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRevenueData } from "@/lib/RevenueDataContext";
import { ADCELLERANT_ICON_BASE64 } from "@/lib/logo-data";

/* ── SVG Skylines ─────────────────────────────────────── */

function DenverSkyline() {
  return (
    <svg
      width="100%"
      height="56"
      viewBox="0 0 200 56"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rocky Mountain peaks */}
      <polygon points="5,55 22,18 39,55" stroke="#4FA3D1" strokeWidth="0.6" />
      <polygon points="18,55 38,10 58,55" stroke="#4FA3D1" strokeWidth="0.6" />
      <polygon points="35,55 50,22 65,55" stroke="#4FA3D1" strokeWidth="0.6" />

      {/* Dense skyline — towers */}
      {[
        { x: 68, w: 7, h: 20 },
        { x: 76, w: 5, h: 14 },
        { x: 82, w: 8, h: 22, antenna: true },
        { x: 91, w: 6, h: 16 },
        { x: 98, w: 7, h: 18 },
        { x: 106, w: 5, h: 12 },
        { x: 112, w: 9, h: 21, antenna: true },
        { x: 122, w: 6, h: 15 },
        { x: 129, w: 7, h: 19 },
        { x: 137, w: 5, h: 13 },
        { x: 143, w: 8, h: 22, antenna: true },
        { x: 152, w: 6, h: 16 },
        { x: 159, w: 7, h: 18 },
        { x: 167, w: 5, h: 14 },
        { x: 173, w: 8, h: 20 },
        { x: 182, w: 6, h: 12 },
        { x: 189, w: 7, h: 17 },
      ].map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={55 - b.h}
            width={b.w}
            height={b.h}
            stroke="#4FA3D1"
            strokeWidth="0.5"
          />
          {b.antenna && (
            <line
              x1={b.x + b.w / 2}
              y1={55 - b.h}
              x2={b.x + b.w / 2}
              y2={55 - b.h - 6}
              stroke="#4FA3D1"
              strokeWidth="0.4"
            />
          )}
        </g>
      ))}

      {/* Ground line */}
      <line x1="0" y1="55" x2="200" y2="55" stroke="#4FA3D1" strokeWidth="0.4" opacity="0.3" />
    </svg>
  );
}

function SaskatoonSkyline() {
  return (
    <svg
      width="100%"
      height="56"
      viewBox="0 0 200 56"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grain terminal — tall elevator body with peaked roof */}
      <rect x="8" y="22" width="10" height="33" stroke="#4FA3D1" strokeWidth="0.5" />
      <polygon points="8,22 13,14 18,22" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Silos beside elevator */}
      <rect x="19" y="30" width="7" height="25" rx="3" stroke="#4FA3D1" strokeWidth="0.5" />
      <rect x="27" y="33" width="6" height="22" rx="2.5" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Diagonal conveyor arm */}
      <line x1="18" y1="24" x2="35" y2="34" stroke="#4FA3D1" strokeWidth="0.4" />

      {/* Bessborough Hotel — LEFT WING */}
      <rect x="50" y="41" width="32" height="14" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Left wing mansard roof */}
      <line x1="50" y1="41" x2="53" y2="37" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="82" y1="41" x2="79" y2="37" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="53" y1="37" x2="79" y2="37" stroke="#4FA3D1" strokeWidth="0.4" />
      {/* Left wing dormers */}
      <polygon points="58,37 60,34 62,37" stroke="#4FA3D1" strokeWidth="0.3" />
      <polygon points="64,37 66,34 68,37" stroke="#4FA3D1" strokeWidth="0.3" />
      <polygon points="70,37 72,34 74,37" stroke="#4FA3D1" strokeWidth="0.3" />

      {/* CENTRE BLOCK */}
      <rect x="82" y="35" width="36" height="20" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Centre mansard roof */}
      <line x1="82" y1="35" x2="85" y2="30" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="118" y1="35" x2="115" y2="30" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="85" y1="30" x2="115" y2="30" stroke="#4FA3D1" strokeWidth="0.4" />
      {/* Centre dormers */}
      <polygon points="88,30 90,27 92,30" stroke="#4FA3D1" strokeWidth="0.3" />
      <polygon points="94,30 96,27 98,30" stroke="#4FA3D1" strokeWidth="0.3" />
      <polygon points="100,30 102,27 104,30" stroke="#4FA3D1" strokeWidth="0.3" />
      <polygon points="106,30 108,27 110,30" stroke="#4FA3D1" strokeWidth="0.3" />
      <polygon points="112,30 114,27 116,30" stroke="#4FA3D1" strokeWidth="0.3" />
      {/* Centre turret */}
      <rect x="88" y="18" width="24" height="12" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Turret spire */}
      <polygon points="92,18 100,6 108,18" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Turret windows */}
      <rect x="95" y="21" width="3" height="4" stroke="#4FA3D1" strokeWidth="0.3" />
      <rect x="102" y="21" width="3" height="4" stroke="#4FA3D1" strokeWidth="0.3" />
      {/* Centre block windows */}
      <rect x="86" y="40" width="3" height="4" stroke="#4FA3D1" strokeWidth="0.3" />
      <rect x="92" y="40" width="3" height="4" stroke="#4FA3D1" strokeWidth="0.3" />
      <rect x="98" y="40" width="3" height="4" stroke="#4FA3D1" strokeWidth="0.3" />
      <rect x="104" y="40" width="3" height="4" stroke="#4FA3D1" strokeWidth="0.3" />
      <rect x="110" y="40" width="3" height="4" stroke="#4FA3D1" strokeWidth="0.3" />

      {/* RIGHT WING (mirror of left) */}
      <rect x="118" y="41" width="32" height="14" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Right wing mansard roof */}
      <line x1="118" y1="41" x2="121" y2="37" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="150" y1="41" x2="147" y2="37" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="121" y1="37" x2="147" y2="37" stroke="#4FA3D1" strokeWidth="0.4" />
      {/* Right wing dormers */}
      <polygon points="126,37 128,34 130,37" stroke="#4FA3D1" strokeWidth="0.3" />
      <polygon points="132,37 134,34 136,37" stroke="#4FA3D1" strokeWidth="0.3" />
      <polygon points="138,37 140,34 142,37" stroke="#4FA3D1" strokeWidth="0.3" />

      {/* River/bridge far right */}
      <line x1="160" y1="52" x2="198" y2="52" stroke="#4FA3D1" strokeWidth="0.5" />
      <line x1="168" y1="52" x2="168" y2="47" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="178" y1="52" x2="178" y2="47" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="188" y1="52" x2="188" y2="47" stroke="#4FA3D1" strokeWidth="0.4" />

      {/* Ground line */}
      <line x1="0" y1="55" x2="200" y2="55" stroke="#4FA3D1" strokeWidth="0.4" opacity="0.3" />
    </svg>
  );
}

function LondonSkyline() {
  return (
    <svg
      width="100%"
      height="56"
      viewBox="0 0 200 56"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 2 low buildings — left edge */}
      <rect x="2" y="45" width="8" height="10" stroke="#4FA3D1" strokeWidth="0.5" />
      <rect x="11" y="42" width="7" height="13" stroke="#4FA3D1" strokeWidth="0.5" />

      {/* London Eye */}
      <circle cx="32" cy="35" r="12" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Spokes */}
      <line x1="32" y1="23" x2="32" y2="47" stroke="#4FA3D1" strokeWidth="0.3" />
      <line x1="20" y1="35" x2="44" y2="35" stroke="#4FA3D1" strokeWidth="0.3" />
      <line x1="23.5" y1="26.5" x2="40.5" y2="43.5" stroke="#4FA3D1" strokeWidth="0.3" />
      <line x1="40.5" y1="26.5" x2="23.5" y2="43.5" stroke="#4FA3D1" strokeWidth="0.3" />
      {/* Support legs */}
      <line x1="32" y1="47" x2="26" y2="55" stroke="#4FA3D1" strokeWidth="0.4" />
      <line x1="32" y1="47" x2="38" y2="55" stroke="#4FA3D1" strokeWidth="0.4" />

      {/* Mid-rise buildings between Eye and Shard */}
      <rect x="46" y="40" width="6" height="15" stroke="#4FA3D1" strokeWidth="0.5" />
      <rect x="53" y="37" width="7" height="18" stroke="#4FA3D1" strokeWidth="0.5" />
      <rect x="61" y="42" width="5" height="13" stroke="#4FA3D1" strokeWidth="0.5" />
      <rect x="67" y="39" width="6" height="16" stroke="#4FA3D1" strokeWidth="0.5" />

      {/* The Shard — tall narrow isoceles triangle */}
      <polygon points="78,55 82,4 86,55" stroke="#4FA3D1" strokeWidth="0.5" />
      <line x1="79.3" y1="42" x2="84.7" y2="42" stroke="#4FA3D1" strokeWidth="0.3" />
      <line x1="80" y1="30" x2="84" y2="30" stroke="#4FA3D1" strokeWidth="0.3" />
      <line x1="80.8" y1="18" x2="83.2" y2="18" stroke="#4FA3D1" strokeWidth="0.3" />

      {/* The Gherkin — teardrop/oval */}
      <ellipse cx="95" cy="36" rx="5" ry="14" stroke="#4FA3D1" strokeWidth="0.5" />
      <line x1="95" y1="22" x2="95" y2="19" stroke="#4FA3D1" strokeWidth="0.3" />

      {/* 22 Bishopsgate — tall thin rect */}
      <rect x="104" y="20" width="6" height="35" stroke="#4FA3D1" strokeWidth="0.5" />
      <line x1="104" y1="32" x2="110" y2="32" stroke="#4FA3D1" strokeWidth="0.3" />
      <line x1="104" y1="42" x2="110" y2="42" stroke="#4FA3D1" strokeWidth="0.3" />

      {/* Walkie Talkie — trapezoid wider at top */}
      <polygon points="114,55 115,28 127,28 128,55" stroke="#4FA3D1" strokeWidth="0.5" />

      {/* Cheesegrater — right-angle triangle */}
      <polygon points="132,55 132,22 142,55" stroke="#4FA3D1" strokeWidth="0.5" />
      <line x1="132" y1="35" x2="138" y2="35" stroke="#4FA3D1" strokeWidth="0.3" />
      <line x1="132" y1="45" x2="141" y2="45" stroke="#4FA3D1" strokeWidth="0.3" />

      {/* NatWest Tower — rect with antenna */}
      <rect x="145" y="28" width="6" height="27" stroke="#4FA3D1" strokeWidth="0.5" />
      <line x1="148" y1="28" x2="148" y2="22" stroke="#4FA3D1" strokeWidth="0.3" />

      {/* Big Ben / Elizabeth Tower */}
      {/* Wide base */}
      <rect x="158" y="48" width="12" height="7" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Tower body */}
      <rect x="160" y="22" width="8" height="26" stroke="#4FA3D1" strokeWidth="0.5" />
      {/* Clock face */}
      <circle cx="164" cy="28" r="2.5" stroke="#4FA3D1" strokeWidth="0.4" />
      {/* Clock hands */}
      <line x1="164" y1="28" x2="164" y2="26" stroke="#4FA3D1" strokeWidth="0.3" />
      <line x1="164" y1="28" x2="165.5" y2="29" stroke="#4FA3D1" strokeWidth="0.3" />
      {/* Belfry band */}
      <line x1="160" y1="24" x2="168" y2="24" stroke="#4FA3D1" strokeWidth="0.4" />
      {/* Pointed spire */}
      <polygon points="161,22 164,12 167,22" stroke="#4FA3D1" strokeWidth="0.5" />

      {/* Westminster Bridge — thick line under Big Ben */}
      <line x1="155" y1="54" x2="180" y2="54" stroke="#4FA3D1" strokeWidth="0.8" />

      {/* Buildings right of Big Ben */}
      <rect x="172" y="40" width="5" height="15" stroke="#4FA3D1" strokeWidth="0.5" />
      <rect x="178" y="44" width="6" height="11" stroke="#4FA3D1" strokeWidth="0.5" />
      <rect x="185" y="42" width="5" height="13" stroke="#4FA3D1" strokeWidth="0.5" />
      <rect x="191" y="46" width="7" height="9" stroke="#4FA3D1" strokeWidth="0.5" />

      {/* Ground line */}
      <line x1="0" y1="55" x2="200" y2="55" stroke="#4FA3D1" strokeWidth="0.4" opacity="0.3" />
    </svg>
  );
}

/* ── Wireframe Globe SVG ──────────────────────────────── */

function WireframeGlobe() {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="topbar-globe"
    >
      {/* Outer circle */}
      <circle cx="14" cy="14" r="12" stroke="#4FA3D1" strokeWidth="0.8" />
      {/* Vertical meridian (center) */}
      <ellipse cx="14" cy="14" rx="5" ry="12" stroke="#4FA3D1" strokeWidth="0.6" />
      {/* Second vertical meridian */}
      <ellipse cx="14" cy="14" rx="9" ry="12" stroke="#4FA3D1" strokeWidth="0.4" />
      {/* Horizontal latitude lines */}
      <ellipse cx="14" cy="8" rx="11" ry="2" stroke="#4FA3D1" strokeWidth="0.5" />
      <line x1="2" y1="14" x2="26" y2="14" stroke="#4FA3D1" strokeWidth="0.5" />
      <ellipse cx="14" cy="20" rx="11" ry="2" stroke="#4FA3D1" strokeWidth="0.5" />
    </svg>
  );
}

/* ── Topbar ────────────────────────────────────────────── */

const orb = "var(--font-orbitron), monospace";

function formatUploadTimestamp(iso: string | null): string {
  if (!iso) return "not uploaded";
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[d.getMonth()];
  const day = d.getDate();
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${hours}:${mins} ${ampm}`;
}

function formatUploadTimestampShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${mins} ${ampm}`;
}

export default function Topbar() {
  const [times, setTimes] = useState({ denver: "", saskatoon: "", london: "" });
  const [cityDates, setCityDates] = useState({ denver: "", saskatoon: "", london: "" });
  const router = useRouter();
  const pathname = usePathname();
  useSession(); // keep hook call for auth context
  const { csvUploadedAt, excelUploadedAt } = useRevenueData();

  const isOnDashboard = pathname === "/dashboard" || pathname === "/";

  useEffect(() => {
    function tick() {
      const fmtTime = (tz: string) =>
        new Date().toLocaleTimeString("en-GB", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      const fmtDate = (tz: string) => {
        const d = new Date();
        const weekday = d.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
        const month = d.toLocaleDateString("en-US", { timeZone: tz, month: "short" });
        const day = d.toLocaleDateString("en-US", { timeZone: tz, day: "numeric" });
        return `${weekday}, ${month} ${day}`;
      };
      setTimes({
        denver: fmtTime("America/Denver"),
        saskatoon: fmtTime("America/Regina"),
        london: fmtTime("Europe/London"),
      });
      setCityDates({
        denver: fmtDate("America/Denver"),
        saskatoon: fmtDate("America/Regina"),
        london: fmtDate("Europe/London"),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const cities = [
    { label: "DENVER", time: times.denver, date: cityDates.denver, Skyline: DenverSkyline },
    { label: "SASKATOON", time: times.saskatoon, date: cityDates.saskatoon, Skyline: SaskatoonSkyline },
    { label: "LONDON", time: times.london, date: cityDates.london, Skyline: LondonSkyline },
  ] as const;

  const hubspotDisplay = formatUploadTimestamp(csvUploadedAt);
  const revenueDisplay = formatUploadTimestamp(excelUploadedAt);
  const hubspotShort = formatUploadTimestampShort(csvUploadedAt);
  const revenueShort = formatUploadTimestampShort(excelUploadedAt);

  const navBtnBase: React.CSSProperties = {
    fontFamily: orb,
    color: "#F0F4F8",
    letterSpacing: 1,
    background: "transparent",
    border: "1px solid #2A3F5C",
    borderRadius: 6,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <>
      {/* Responsive styles */}
      <style>{`
        .topbar-globe { width: 28px; height: 28px; flex-shrink: 0; }
        .topbar-flame { height: 48px; width: auto; }
        .topbar-cmd { font-size: 16px; }
        .topbar-ctr { font-size: 11px; }
        .topbar-nav-btn { font-size: 12px; padding: 4px 12px; }
        .topbar-nav-label { display: inline; }
        .topbar-indicator { font-size: 10px; }
        .topbar-indicator-val { font-size: 10px; }
        .topbar-indicator-mobile { display: none !important; }
        .topbar-city-label { font-size: 9px; }
        .topbar-city-time { font-size: 13px; }
        .topbar-city-date { font-size: 13px; display: inline; }
        .topbar-city-dot { display: inline; }
        .topbar-skyline { display: block; }
        .topbar-divider { display: block; }
        .topbar-header { height: 80px; flex-direction: row; flex-wrap: nowrap; }
        .topbar-row1 { display: contents; }
        .topbar-row2 { display: contents; }
        .topbar-clocks { display: flex; flex: 1; }

        @media (max-width: 767px) {
          .topbar-header { height: auto; flex-direction: column; flex-wrap: nowrap; }
          .topbar-row1 {
            display: flex; align-items: center; width: 100%;
            padding: 6px 10px; gap: 6px; justify-content: space-between;
          }
          .topbar-row2 {
            display: flex; align-items: center; width: 100%;
            padding: 2px 10px 6px; gap: 8px; justify-content: space-between;
          }
          .topbar-globe { width: 20px; height: 20px; }
          .topbar-flame { height: 28px; }
          .topbar-cmd { font-size: 12px; }
          .topbar-ctr { font-size: 9px; }
          .topbar-nav-btn { font-size: 11px; padding: 3px 8px; }
          .topbar-nav-label { display: none; }
          .topbar-indicator { font-size: 8px; }
          .topbar-indicator-val { font-size: 8px; }
          .topbar-indicator-mobile { display: inline !important; }
          .topbar-city-label { font-size: 8px; }
          .topbar-city-time { font-size: 12px; }
          .topbar-city-date { display: none; }
          .topbar-city-dot { display: none; }
          .topbar-skyline { display: none; }
          .topbar-divider { display: none; }
          .topbar-clocks { display: flex; flex: 0 1 auto; gap: 2px; }
        }
      `}</style>

      <header
        className="topbar-header"
        style={{
          background: "#0B1624",
          borderBottom: "0.5px solid #1E3A5F",
          display: "flex",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
          width: "100%",
          maxWidth: "100vw",
          overflow: "hidden",
        }}
      >
        {/* ── ROW 1 (on mobile): Logo + Globe + Title | Nav buttons ── */}
        <div className="topbar-row1">
          {/* Logo area */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }} className="topbar-logo-area">
            <div style={{ display: "flex", alignItems: "center", padding: "0 0 0 6px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ADCELLERANT_ICON_BASE64}
                alt="AdCellerant"
                className="topbar-flame"
                style={{ mixBlendMode: "screen", display: "block" }}
              />
            </div>
            <WireframeGlobe />
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <span
                className="topbar-cmd"
                style={{
                  fontFamily: orb,
                  fontWeight: 700,
                  color: "#FF4A2D",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                COMMAND
              </span>
              <span
                className="topbar-ctr"
                style={{
                  fontFamily: orb,
                  fontWeight: 400,
                  color: "#FF4A2D",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                CENTER
              </span>
            </div>
          </div>

          {/* Divider (desktop only) */}
          <div className="topbar-divider" style={{ width: 1, height: 40, background: "#2A3F5C", flexShrink: 0 }} />

          {/* Navigation buttons */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 6px", gap: 6, flexShrink: 0 }}>
            {!isOnDashboard && (
              <button
                onClick={() => router.push("/dashboard")}
                className="topbar-nav-btn"
                style={navBtnBase}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4FA3D1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A3F5C"; }}
              >
                ←<span className="topbar-nav-label"> Dashboard</span>
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="topbar-nav-btn"
              style={navBtnBase}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4FA3D1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A3F5C"; }}
            >
              ↻<span className="topbar-nav-label"> Refresh</span>
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="topbar-nav-btn"
              style={navBtnBase}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4FA3D1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A3F5C"; }}
            >
              ⚙<span className="topbar-nav-label"> Admin</span>
            </button>
          </div>
        </div>

        {/* Divider (desktop only) */}
        <div className="topbar-divider" style={{ width: 1, height: 40, background: "#2A3F5C", flexShrink: 0 }} />

        {/* ── ROW 2 (on mobile): Data indicators | City clocks ── */}
        <div className="topbar-row2">
          {/* Data freshness indicators */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="topbar-indicator" style={{ fontFamily: orb, color: "#6B7F96" }}>HubSpot</span>
              <span
                className="topbar-indicator-val"
                style={{ fontFamily: orb, color: csvUploadedAt ? "#2ECC8A" : "#F5A623" }}
              >
                {/* Desktop: full timestamp, Mobile: time only */}
                <span className="topbar-nav-label">{hubspotDisplay}</span>
                <span style={{ display: "none" }} className="topbar-indicator-mobile">{csvUploadedAt ? hubspotShort : "—"}</span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="topbar-indicator" style={{ fontFamily: orb, color: "#6B7F96" }}>Revenue</span>
              <span
                className="topbar-indicator-val"
                style={{ fontFamily: orb, color: excelUploadedAt ? "#2ECC8A" : "#F5A623" }}
              >
                <span className="topbar-nav-label">{revenueDisplay}</span>
                <span style={{ display: "none" }} className="topbar-indicator-mobile">{excelUploadedAt ? revenueShort : "—"}</span>
              </span>
            </div>
          </div>

          {/* Divider (desktop only) */}
          <div className="topbar-divider" style={{ width: 1, height: 40, background: "#2A3F5C", flexShrink: 0 }} />

          {/* City clocks */}
          <div className="topbar-clocks">
            {cities.map((city, i) => (
              <div
                key={city.label}
                style={{
                  flex: 1,
                  borderRight: i < cities.length - 1 ? "0.5px solid #1E3A5F" : "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingBottom: 4,
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <div className="topbar-skyline" style={{ maxHeight: 40, overflow: "hidden" }}>
                  <city.Skyline />
                </div>
                <span
                  className="topbar-city-label"
                  style={{
                    fontFamily: orb,
                    fontWeight: 700,
                    color: "#FF4A2D",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginTop: 1,
                  }}
                >
                  {city.label}
                </span>
                <span style={{ fontFamily: orb, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                  <span className="topbar-city-time" style={{ fontWeight: 600, color: "#F0F4F8" }}>
                    {city.time.slice(0, 5)}
                  </span>
                  <span className="topbar-city-dot" style={{ color: "#6B7F96" }}> · </span>
                  <span className="topbar-city-date" style={{ color: "#6B7F96" }}>{city.date}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
