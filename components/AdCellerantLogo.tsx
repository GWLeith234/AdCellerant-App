import { ADCELLERANT_ICON_BASE64 } from "@/lib/logo-data";

export default function AdCellerantLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ADCELLERANT_ICON_BASE64}
        alt="AdCellerant"
        style={{
          height: "32px",
          width: "auto",
          mixBlendMode: "screen",
          display: "block",
        }}
      />
      <span
        style={{
          color: "#FFFFFF",
          fontSize: "16px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        adcellerant
      </span>
    </div>
  );
}
