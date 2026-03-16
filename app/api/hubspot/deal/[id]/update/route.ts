import { NextResponse } from "next/server";
import { updateDeal } from "@/lib/hubspot";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const deal = await updateDeal(params.id, body.properties || {});
    return NextResponse.json({ deal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
