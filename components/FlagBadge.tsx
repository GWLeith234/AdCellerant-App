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
        <defs>
          <clipPath id="ca-clip">
            <circle cx="20" cy="20" r="18" />
          </clipPath>
        </defs>
        <circle cx="20" cy="20" r="19" fill="white" stroke="#0D1B2E" strokeWidth="2" />
        <g clipPath="url(#ca-clip)">
          {/* Red left bar */}
          <rect x="2" y="2" width="10" height="36" fill="#FF0000" />
          {/* Red right bar */}
          <rect x="28" y="2" width="10" height="36" fill="#FF0000" />
          {/* White center is the circle fill */}
          {/* Maple leaf */}
          <path
            fill="#FF0000"
            d="M20,10 L21,14 L24,12.5 L22.5,15.5 L26.5,16 L23.5,18 L25,20 L20,17 L15,20 L16.5,18 L13.5,16 L17.5,15.5 L16,12.5 L19,14 Z"
          />
          <rect x="19" y="17" width="2" height="7" fill="#FF0000" rx="0.5" />
        </g>
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
