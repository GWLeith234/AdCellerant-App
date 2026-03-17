"use client";

import { useRouter } from "next/navigation";

const orb = "var(--font-orbitron), monospace";

const btnStyle: React.CSSProperties = {
  fontFamily: orb,
  fontSize: 7,
  color: "#6B7F96",
  letterSpacing: 1.5,
  background: "transparent",
  border: "0.5px solid #2A3F5C",
  padding: "3px 8px",
  borderRadius: 3,
  cursor: "pointer",
};

interface SubNavProps {
  rep: string | null;
  userEmail: string;
  refreshing: boolean;
  dealsLoading: boolean;
  isMock: boolean;
  onRefresh: () => void;
}

export default function SubNav({ rep, userEmail, refreshing, dealsLoading, isMock, onRefresh }: SubNavProps) {
  const router = useRouter();
  const isRepPage = rep !== null;
  const isAdmin = userEmail === "george.leith@adcellerant.com";

  return (
    <div
      style={{
        height: 36,
        background: "#0D1B2E",
        borderBottom: "0.5px solid #1E3A5F",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 6,
        position: "sticky",
        top: 90,
        zIndex: 90,
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
      }}
    >
      {/* Back / All Reps button — only on /dashboard/[rep] */}
      {isRepPage && (
        <>
          <button
            onClick={() => router.push("/dashboard")}
            style={btnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F0F4F8";
              e.currentTarget.style.borderColor = "#4FA3D1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6B7F96";
              e.currentTarget.style.borderColor = "#2A3F5C";
            }}
          >
            ← All Reps
          </button>
          {/* Vertical divider */}
          <div style={{ width: 0.5, height: 20, background: "#2A3F5C", flexShrink: 0 }} />
        </>
      )}

      {/* Admin button */}
      {isAdmin && (
        <button
          onClick={() => router.push("/admin")}
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#F0F4F8";
            e.currentTarget.style.borderColor = "#4FA3D1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6B7F96";
            e.currentTarget.style.borderColor = "#2A3F5C";
          }}
        >
          ⚙ Admin
        </button>
      )}

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={refreshing || dealsLoading}
        style={{
          ...btnStyle,
          opacity: refreshing || dealsLoading ? 0.5 : 1,
          cursor: refreshing || dealsLoading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!refreshing && !dealsLoading) {
            e.currentTarget.style.color = "#F0F4F8";
            e.currentTarget.style.borderColor = "#4FA3D1";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#6B7F96";
          e.currentTarget.style.borderColor = "#2A3F5C";
        }}
      >
        {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
      </button>

      {/* Status badge — pushed to right */}
      <div style={{ marginLeft: "auto" }}>
        {isMock ? (
          <span
            style={{
              fontFamily: orb,
              fontSize: 7,
              color: "#F5A623",
              background: "rgba(245,166,35,0.1)",
              border: "0.5px solid rgba(245,166,35,0.3)",
              padding: "2px 7px",
              borderRadius: 3,
              letterSpacing: 1,
            }}
          >
            ⚠ MOCK
          </span>
        ) : (
          <span
            style={{
              fontFamily: orb,
              fontSize: 7,
              color: "#2ECC8A",
              background: "rgba(46,204,138,0.1)",
              border: "0.5px solid rgba(46,204,138,0.3)",
              padding: "2px 7px",
              borderRadius: 3,
              letterSpacing: 1,
            }}
          >
            ● LIVE
          </span>
        )}
      </div>
    </div>
  );
}
