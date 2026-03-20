"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import DataUploadPanel from "@/components/DataUploadPanel";
import { useRevenueData } from "@/lib/RevenueDataContext";
import { useDealData } from "@/lib/DealDataContext";

const ALLOWED_EMAILS = [
  "george.leith@adcellerant.com",
  "andy.mcnab@adcellerant.com",
  "alex.kirkley@adcellerant.com",
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { loadRevenueData, resetRevenueData, hasRevenueData, dataSource } = useRevenueData();
  const { loadUploadedDeals, resetUploadedDeals, hasUploadedDeals } = useDealData();

  const [hubspotStatus, setHubspotStatus] = useState<"checking" | "live" | "mock">("checking");
  const [anthropicStatus, setAnthropicStatus] = useState<"checking" | "connected" | "missing">("checking");

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check system status on mount
  useEffect(() => {
    // Check HubSpot
    fetch("/api/hubspot/deals")
      .then((res) => res.json())
      .then((data) => {
        setHubspotStatus(data.mock ? "mock" : "live");
      })
      .catch(() => setHubspotStatus("mock"));

    // Check Anthropic by trying the parse-log endpoint with empty body to see if API key configured
    fetch("/api/ai/parse-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => {
        // 503 = key not configured, 400 = key exists but bad request (good!)
        setAnthropicStatus(res.status === 503 ? "missing" : "connected");
      })
      .catch(() => setAnthropicStatus("missing"));
  }, []);

  // Check email access
  const userEmail = session?.user?.email?.toLowerCase() || "";
  const isAllowed = ALLOWED_EMAILS.includes(userEmail) || !session;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-navy">
        <Topbar />
        <main className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
          <div className="text-muted text-sm">Loading...</div>
        </main>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  // For dev mode (no session), allow access
  const showPage = !session || isAllowed;

  if (!showPage) {
    return (
      <div className="min-h-screen bg-navy">
        <Topbar />
        <main className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
          <div className="text-orange text-sm">Access denied. Admin only.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <Topbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
        {/* Page title */}
        <h1 className="text-white text-2xl font-bold tracking-tight mb-1">ADMIN</h1>
        <div className="h-px bg-border mb-6" />

        {/* Revenue Data section */}
        <section className="mb-8">
          <h2 className="text-[#FF4A2D] text-xs font-bold tracking-widest uppercase mb-4">
            Revenue Data
          </h2>
          <DataUploadPanel
            onDataLoaded={loadRevenueData}
            onDealsLoaded={loadUploadedDeals}
            hasExistingData={hasRevenueData}
            hasExistingDeals={hasUploadedDeals}
          />
        </section>

        {/* System Status section */}
        <section className="mb-8">
          <h2 className="text-[#FF4A2D] text-xs font-bold tracking-widest uppercase mb-4">
            System Status
          </h2>
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <StatusRow
              label="HubSpot Connection"
              value={
                hubspotStatus === "checking"
                  ? "Checking..."
                  : hubspotStatus === "live"
                  ? "Live"
                  : "Mock Data"
              }
              status={hubspotStatus === "live" ? "green" : hubspotStatus === "mock" ? "amber" : "muted"}
            />
            <StatusRow
              label="Anthropic API"
              value={
                anthropicStatus === "checking"
                  ? "Checking..."
                  : anthropicStatus === "connected"
                  ? "Connected"
                  : "Not configured"
              }
              status={anthropicStatus === "connected" ? "green" : anthropicStatus === "missing" ? "amber" : "muted"}
            />
            <StatusRow
              label="Claude Project ID"
              value="019c2f71-edd1-7381-8879-219db0696fd0"
              status="muted"
            />
            <StatusRow
              label="Allowed Emails"
              value={`${ALLOWED_EMAILS.length} users`}
              status="muted"
            />
            <StatusRow
              label="Revenue Source"
              value={dataSource === "csv" ? "CSV Upload" : dataSource === "live" ? "HubSpot Live" : "Mock Data"}
              status={dataSource === "mock" ? "amber" : "green"}
            />
            <StatusRow
              label="Deal Source"
              value={hasUploadedDeals ? "CSV Upload" : "Mock Data"}
              status={hasUploadedDeals ? "green" : "amber"}
            />
          </div>
        </section>

        {/* Mock Data section */}
        <section className="mb-8">
          <h2 className="text-[#FF4A2D] text-xs font-bold tracking-widest uppercase mb-4">
            Mock Data
          </h2>
          <button
            onClick={() => { resetRevenueData(); resetUploadedDeals(); }}
            className="bg-card border border-border hover:border-amber/50 text-muted hover:text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            🔄 Reset to mock data
          </button>
          <p className="text-muted text-xs mt-2">
            Clears any uploaded revenue and deal data, reverts to mock values.
          </p>
        </section>
      </main>
    </div>
  );
}

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "green" | "amber" | "muted";
}) {
  const dotColor =
    status === "green"
      ? "bg-green"
      : status === "amber"
      ? "bg-amber"
      : "bg-muted/50";

  const textColor =
    status === "green"
      ? "text-green"
      : status === "amber"
      ? "text-amber"
      : "text-muted";

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted text-sm">{label}</span>
      <span className={`text-sm font-medium flex items-center gap-2 ${textColor}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        {value}
      </span>
    </div>
  );
}
