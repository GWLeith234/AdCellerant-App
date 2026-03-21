import { ADCELLERANT_ICON_BASE64 } from "@/lib/logo-data";

export default function AdCellerantLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ADCELLERANT_ICON_BASE64}
        alt="AdCellerant"
        style={{
          height: "48px",
          width: "auto",
          mixBlendMode: "screen",
          display: "block",
        }}
      />
    </div>
  );
}
