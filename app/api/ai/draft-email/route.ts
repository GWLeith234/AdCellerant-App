import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const TONE_DESCRIPTIONS: Record<string, string> = {
  warm: "Warm & Relationship-focused — build rapport, show genuine interest, personal touch",
  direct: "Direct & Commercial — get to the point, focus on value proposition and next steps",
  followup: "Follow-Up — reference previous conversation, gently nudge, maintain momentum",
  urgency: "Urgency/Close — create time pressure, highlight what they'll miss, push for commitment",
  checkin: "Check-In — casual touchpoint, no hard ask, keep relationship warm",
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { deal, tone } = body;

    if (!deal || !tone) {
      return NextResponse.json({ error: "deal and tone required" }, { status: 400 });
    }

    const toneDesc = TONE_DESCRIPTIONS[tone] || tone;

    // Build MEDDIC summary
    const meddicEntries = Object.entries(deal.meddic || {})
      .map(([k, v]) => `${k}: ${v || "gap"}`)
      .join(", ");

    // Build doc status
    const docStatus = ["nda", "msa", "sow", "credit", "bizdev", "partner"]
      .map((k) => `${k.toUpperCase()}: ${deal[k] || "not started"}`)
      .join(", ");

    // Build contacts string
    const contactsStr = (deal.contacts || [])
      .map((c: { name: string; role: string }) => `${c.name} (${c.role})`)
      .join(", ") || "No contacts listed";

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      system: `You are George Leith, VP Sales at AdCellerant. You write emails that are:
- Direct and warm — no corporate filler
- 120-200 words maximum
- Always end with a single, clear call-to-action
- Use short paragraphs (1-3 sentences each)
- Never use phrases like "I hope this finds you well" or "Just circling back"
- Sound human, not templated
- Reference specific deal context naturally`,
      messages: [
        {
          role: "user",
          content: `Draft a client email with this tone: ${toneDesc}

Deal context:
- Company: ${deal.name}
- Sub: ${deal.sub || "N/A"}
- Stage: ${deal.stage} (${deal.stageAge} days in stage)
- Value: ${deal.valShort}
- Close date: ${deal.closeDate || "Not set"}
- Persona: ${deal.persona || "Not set"}
- Contacts: ${contactsStr}
- MEDDIC: ${meddicEntries}
- Documents: ${docStatus}
- Next action: ${deal.action1}
- Description notes: ${deal.description ? deal.description.substring(0, 500) : "None"}

Return a JSON object with exactly this structure:
{
  "subject": "email subject line",
  "body": "full email body text"
}

Return ONLY valid JSON, no markdown fences.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
    }

    const parsed = JSON.parse(content.text);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Email generation error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
