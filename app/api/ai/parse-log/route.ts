import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic();
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      error: "ANTHROPIC_API_KEY not configured",
      message: "Add ANTHROPIC_API_KEY to Railway environment variables",
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { text, deal } = body;

    if (!text || !deal) {
      return NextResponse.json({ error: "text and deal required" }, { status: 400 });
    }

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: "Respond with raw JSON only. Do not wrap in markdown code blocks. Do not include ```json or ``` anywhere in your response. Return only the JSON object itself.",
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
      console.error("Parse-log error:", parseErr);
      console.error("Raw response was:", raw.substring(0, 200));
      return NextResponse.json({
        error: "Failed to parse AI response",
        raw: raw.substring(0, 500),
      }, { status: 500 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI parse error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
