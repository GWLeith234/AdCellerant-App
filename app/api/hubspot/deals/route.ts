import { NextResponse } from "next/server";
import { fetchAllDeals } from "@/lib/hubspot";
import { getAllDeals } from "@/lib/dataProvider";

export async function GET() {
  try {
    const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
    if (!hasToken) {
      // Return master data deals when no HubSpot token is configured
      return NextResponse.json({ deals: getAllDeals(), mock: true });
    }

    const deals = await fetchAllDeals();
    return NextResponse.json({ deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[HubSpot deals]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
