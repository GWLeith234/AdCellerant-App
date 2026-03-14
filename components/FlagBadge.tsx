"use client";

interface FlagBadgeProps {
  country: "ca" | "uk";
  size?: number;
}

export default function FlagBadge({ country, size = 20 }: FlagBadgeProps) {
  if (country === "ca") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="absolute -bottom-1 -right-1"
      >
        <circle cx="20" cy="20" r="19" fill="#FF0000" stroke="#0D1B2E" strokeWidth="2" />
        <circle cx="20" cy="20" r="15" fill="white" />
        {/* Maple leaf polygon */}
        <polygon
          fill="#FF0000"
          points="20,8 21.5,14 24,13 22.5,16 26,16 23,18.5 24.5,20 20,17.5 15.5,20 17,18.5 14,16 17.5,16 16,13 18.5,14"
        />
        {/* Stem */}
        <rect x="19" y="17.5" width="2" height="6" fill="#FF0000" />
      </svg>
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
