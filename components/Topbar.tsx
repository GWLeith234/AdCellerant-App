"use client";

import { useEffect, useState } from "react";

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

/* ── Topbar ────────────────────────────────────────────── */

const orb = "var(--font-orbitron), monospace";

export default function Topbar() {
  const [times, setTimes] = useState({ denver: "", saskatoon: "", london: "" });
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const date = new Date().toLocaleDateString("en-US", {
      timeZone: "America/Denver",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    // Format as "MONDAY · MARCH 16 · 2026"
    const parts = date.replace(",", "").split(" ");
    // parts: ["Monday", "March", "16", "2026"]
    const formatted = `${parts[0]} · ${parts[1]} ${parts[2]} · ${parts[3]}`.toUpperCase();
    setFormattedDate(formatted);
  }, []);

  useEffect(() => {
    function tick() {
      const fmt = (tz: string) =>
        new Date().toLocaleTimeString("en-GB", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      setTimes({
        denver: fmt("America/Denver"),
        saskatoon: fmt("America/Regina"),
        london: fmt("Europe/London"),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const cities = [
    { label: "DENVER", time: times.denver, Skyline: DenverSkyline },
    { label: "SASKATOON", time: times.saskatoon, Skyline: SaskatoonSkyline },
    { label: "LONDON", time: times.london, Skyline: LondonSkyline },
  ] as const;

  return (
    <header
      style={{
        height: 90,
        background: "#0B1624",
        borderBottom: "0.5px solid #1E3A5F",
        display: "flex",
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          gap: 12,
          borderRight: "0.5px solid #1E3A5F",
          flexShrink: 0,
        }}
      >
        {/* A) AdCellerant icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/adcellerant-icon.png"
          alt=""
          style={{
            width: 36,
            height: 36,
            objectFit: "contain",
            mixBlendMode: "screen",
            flexShrink: 0,
          }}
        />

        {/* Vertical divider */}
        <div style={{ width: 1, height: 48, background: "#2A3F5C", flexShrink: 0 }} />

        {/* B) Globe + COMMAND / CENTER */}
        <div
          style={{
            borderLeft: "0.5px solid #1E3A5F",
            paddingLeft: 12,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <span
              style={{
                fontFamily: orb,
                fontSize: 16,
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
              style={{
                fontFamily: orb,
                fontSize: 11,
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
      </div>

      {/* ── RIGHT PANEL — City panels ── */}
      <div style={{ display: "flex", flex: 1 }}>
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
              paddingBottom: 5,
              overflow: "hidden",
            }}
          >
            <city.Skyline />
            <span
              style={{
                fontFamily: orb,
                fontSize: 6,
                color: "#4FA3D1",
                letterSpacing: 2,
                marginTop: 2,
              }}
            >
              {city.label}
            </span>
            <span
              style={{
                fontFamily: orb,
                fontSize: 10,
                fontWeight: 700,
                color: "#F0F4F8",
                letterSpacing: 1,
              }}
            >
              {city.time}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}
