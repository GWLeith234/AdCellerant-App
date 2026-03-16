import { NextResponse } from "next/server";
import { fetchDealById } from "@/lib/hubspot";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deal = await fetchDealById(params.id);
    return NextResponse.json({ deal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
