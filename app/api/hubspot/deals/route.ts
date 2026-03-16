import { NextResponse } from "next/server";
import { fetchAllDeals } from "@/lib/hubspot";

export async function GET() {
  try {
    const deals = await fetchAllDeals();
    return NextResponse.json({ deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
