import { NextResponse } from "next/server";
import { appendResearchNote } from "@/lib/hubspot";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { note } = body;

    if (!note || typeof note !== "string" || !note.trim()) {
      return NextResponse.json({ error: "note is required" }, { status: 400 });
    }

    const updatedDescription = await appendResearchNote(params.id, note.trim());
    return NextResponse.json({ success: true, description: updatedDescription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
