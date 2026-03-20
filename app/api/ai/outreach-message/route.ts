import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic();
}

const CHANNEL_PROMPTS: Record<string, string> = {
  email: `You are George Leith, President of International Partnerships at AdCellerant. Write a short, warm follow-up email (80-120 words) to keep this deal moving. Use George's voice: direct, warm, specific, never corporate. Reference the deal context provided. End with a single soft ask — a quick call or a reply.
Return JSON: { "subject": "string", "body": "string" }`,

  linkedin: `Write a short LinkedIn DM (40-60 words max) from George Leith at AdCellerant. Warm, peer-to-peer tone. Reference one specific thing about the deal or their company. One question or soft ask at the end. No LinkedIn clichés. Sound human.
Return JSON: { "message": "string" }`,

  sms: `Write a short text message (under 40 words) from George at AdCellerant. Casual, direct, like a text you'd send to someone you know. Reference the deal or person specifically. One ask.
Return JSON: { "message": "string" }`,
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      error: "ANTHROPIC_API_KEY not configured",
      message: "Add ANTHROPIC_API_KEY to Railway environment variables",
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { dealName, stage, daysStale, contacts, lastActivity, meddicNotes, channel } = body;

    if (!dealName || !channel) {
      return NextResponse.json({ error: "dealName and channel required" }, { status: 400 });
    }

    const systemPrompt = CHANNEL_PROMPTS[channel];
    if (!systemPrompt) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const contactsStr = (contacts || [])
      .map((c: { name: string; role: string }) => `${c.name} (${c.role})`)
      .join(", ") || "No contacts listed";

    const meddicStr = meddicNotes
      ? Object.entries(meddicNotes)
          .map(([k, v]) => `${k}: ${v || "gap"}`)
          .join(", ")
      : "No MEDDIC data";

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: `${systemPrompt}\nRespond with raw JSON only. Do not wrap in markdown code blocks.`,
      messages: [
        {
          role: "user",
          content: `Deal context:
- Company: ${dealName}
- Stage: ${stage}
- Days since last activity: ${daysStale}
- Last activity: ${lastActivity || "Unknown"}
- Contacts: ${contactsStr}
- MEDDIC: ${meddicStr}

Generate the ${channel} outreach message. Return ONLY valid JSON, no markdown fences.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
    }

    const raw = content.text;
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      console.error("Outreach parse error:", parseErr);
      return NextResponse.json({
        error: "Failed to parse AI response",
        raw: raw.substring(0, 500),
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Outreach generation error:", error);
    let msg = "Outreach generation failed";
    if (error instanceof Anthropic.APIError) {
      msg = `AI service error (${error.status}). Try again in a moment.`;
    } else if (error instanceof Error) {
      msg = error.message;
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
