import { NextResponse } from "next/server";
import { addNoteToDeal } from "@/lib/hubspot";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    if (!body.note || typeof body.note !== "string") {
      return NextResponse.json({ error: "Note body required" }, { status: 400 });
    }
    await addNoteToDeal(params.id, body.note);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
