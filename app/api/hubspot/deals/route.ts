import { NextResponse } from "next/server";
import { fetchAllDeals } from "@/lib/hubspot";

export async function GET() {
  try {
    const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
    if (!hasToken) {
      return NextResponse.json(
        { error: "HUBSPOT_ACCESS_TOKEN env var is not set" },
        { status: 502 }
      );
    }

    const deals = await fetchAllDeals();
    return NextResponse.json({ deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[HubSpot deals]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
