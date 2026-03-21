"use client";

interface FlagBadgeProps {
  country: "ca" | "uk";
  size?: number;
}

export default function FlagBadge({ country, size = 20 }: FlagBadgeProps) {
  if (country === "ca") {
    return (
      <div
        className="absolute -bottom-1 -right-1"
        style={{
          width: size + 2,
          height: size + 2,
          borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid #0D1B2E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        <svg viewBox="0 0 40 20" width={size + 6} height={(size + 6) / 2}>
          <rect x="0" y="0" width="10" height="20" fill="#FF0000" />
          <rect x="10" y="0" width="20" height="20" fill="#FFFFFF" />
          <rect x="30" y="0" width="10" height="20" fill="#FF0000" />
          <path
            d="M20 3.5 L21 7 L18.5 8.5 L19.5 9 L18 12 L19 12 L18.5 14.5 L20 13.5 L21.5 14.5 L21 12 L22 12 L20.5 9 L21.5 8.5 L19 7 Z"
            fill="#FF0000"
          />
        </svg>
      </div>
    );
  }

  // UK flag
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="absolute -bottom-1 -right-1"
    >
      <circle cx="20" cy="20" r="19" fill="#012169" stroke="#0D1B2E" strokeWidth="2" />
      {/* White diagonal cross */}
      <polygon fill="white" points="6,8 10,8 34,32 34,28" />
      <polygon fill="white" points="34,8 30,8 6,32 6,28" />
      {/* White cross */}
      <rect x="17" y="6" width="6" height="28" fill="white" />
      <rect x="6" y="17" width="28" height="6" fill="white" />
      {/* Red diagonal cross */}
      <polygon fill="#C8102E" points="6,9.5 9,8 22,18 22,15" />
      <polygon fill="#C8102E" points="34,30.5 31,32 18,22 18,25" />
      <polygon fill="#C8102E" points="34,9.5 34,12 22,22 25,22" />
      <polygon fill="#C8102E" points="6,30.5 6,28 18,18 15,18" />
      {/* Red cross */}
      <rect x="18" y="6" width="4" height="28" fill="#C8102E" />
      <rect x="6" y="18" width="28" height="4" fill="#C8102E" />
    </svg>
  );
}
