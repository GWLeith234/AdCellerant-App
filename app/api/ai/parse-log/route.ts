import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { text, deal } = body;

    if (!text || !deal) {
      return NextResponse.json({ error: "text and deal required" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a CRM operations assistant. Parse this plain-English log entry into structured operations for a HubSpot deal.

Current deal state:
- Deal name: ${deal.name}
- Stage: ${deal.stage}
- Amount: $${deal.val}
- Close date: ${deal.closeDate || "Not set"}
- Description: ${deal.description || "None"}

User's log entry:
"${text}"

Return a JSON object with this exact structure:
{
  "ops": [
    {
      "type": "update_stage" | "update_close_date" | "update_amount" | "add_note",
      "field": "human-readable field name",
      "currentValue": "current value or —",
      "newValue": "the new value",
      "hubspotProperty": "HubSpot property name (dealstage/closedate/amount) or null for notes",
      "hubspotValue": "value formatted for HubSpot API or the note text"
    }
  ],
  "summary": "one-line summary of all changes"
}

Stage mappings for hubspotValue:
- "appointment scheduled" or "lead" → "appointmentscheduled"
- "qualified to buy" → "qualifiedtobuy"
- "presentation scheduled" or "proposal" → "presentationscheduled"
- "decision maker bought in" or "negotiation" → "decisionmakerboughtin"
- "closed won" → "closedwon"

For close dates, use ISO format (YYYY-MM-DD) in hubspotValue.
For amounts, use numeric string in hubspotValue.
For notes, put the note text in hubspotValue.

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
    const msg = error instanceof Error ? error.message : "AI parse error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
