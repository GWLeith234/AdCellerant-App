import { NextResponse } from "next/server";
import { fetchAllDeals } from "@/lib/hubspot";
import { MOCK_DEALS } from "@/lib/mockData";

export async function GET() {
  try {
    const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
    if (!hasToken) {
      // Return mock data for development when no token is configured
      return NextResponse.json({ deals: MOCK_DEALS, mock: true });
    }

    const deals = await fetchAllDeals();
    return NextResponse.json({ deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[HubSpot deals]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
