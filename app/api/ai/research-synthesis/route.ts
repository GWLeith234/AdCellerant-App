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
    const { deal } = body;

    if (!deal) {
      return NextResponse.json({ error: "deal required" }, { status: 400 });
    }

    // Build MEDDIC summary
    const meddicEntries = Object.entries(deal.meddic || {})
      .map(([k, v]) => `${k}: ${v || "gap"}`)
      .join(", ");

    // Build contacts
    const contactsStr = (deal.contacts || [])
      .map((c: { name: string; role: string }) => `${c.name} (${c.role})`)
      .join(", ") || "No contacts listed";

    // Build doc status
    const docStatus = ["nda", "msa", "sow", "credit", "bizdev", "partner"]
      .map((k) => `${k.toUpperCase()}: ${deal[k] || "not started"}`)
      .join(", ");

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: `You are a senior sales intelligence analyst. You MUST respond with a valid JSON object only. Do NOT use markdown formatting. Do NOT wrap in code blocks. Do NOT include any text before or after the JSON. Start your response with { and end with }. Be specific, actionable, and direct. Reference actual data from the deal context.`,
      messages: [
        {
          role: "user",
          content: `Produce a research synthesis brief for this deal:

Deal: ${deal.name}
Sub: ${deal.sub || "N/A"}
Stage: ${deal.stage} (${deal.stageAge} days in stage)
Value: ${deal.valShort} ($${deal.val})
Close date: ${deal.closeDate || "Not set"}
Persona: ${deal.persona || "Not set"}
Revenue Line: ${deal.revenueLine || "Not set"}
Rep: ${deal.rep}
Contacts: ${contactsStr}
MEDDIC: ${meddicEntries}
Documents: ${docStatus}
Actions: ${deal.action1} / ${deal.action2}

Research notes (accumulated across stages):
${deal.researchNotes || "No research notes on file."}

Full description field:
${deal.description || "No description."}

Return a JSON object with this exact structure:
{
  "sections": [
    {
      "title": "Account Intelligence",
      "items": ["bullet point 1", "bullet point 2", ...]
    },
    {
      "title": "Stakeholder Read",
      "items": ["bullet point 1", ...]
    },
    {
      "title": "MEDDIC Analysis",
      "items": ["bullet point 1", ...]
    },
    {
      "title": "Stage Risk",
      "items": ["bullet point 1", ...]
    },
    {
      "title": "Recommended Next Move",
      "items": ["bullet point 1", ...]
    },
    {
      "title": "Open Questions",
      "items": ["bullet point 1", ...]
    }
  ]
}

Return ONLY valid JSON, no markdown fences.`,
        },
      ],
    });

    const textBlock = message.content?.find(
      (b: { type: string }) => b.type === "text"
    );
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

    console.log("Raw AI response:", JSON.stringify(message.content, null, 2));

    if (!rawText) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    // Strip markdown code fences if present
    let cleaned = rawText.trim();
    // Remove opening ```json or ``` (possibly with leading whitespace/newlines)
    cleaned = cleaned.replace(/^\s*```(?:json)?\s*\n?/i, "");
    // Remove closing ```
    cleaned = cleaned.replace(/\n?\s*```\s*$/g, "");
    cleaned = cleaned.trim();

    if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
      console.error("Response is not JSON:", cleaned.substring(0, 200));
      return NextResponse.json({
        error: "AI returned non-JSON response",
        preview: cleaned.substring(0, 200),
      }, { status: 500 });
    }

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      console.error("Research parse error:", parseErr);
      console.error("Raw response was:", rawText.substring(0, 500));
      return NextResponse.json({
        error: "Failed to parse AI response",
        raw: rawText.substring(0, 500),
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Research synthesis error:", error);
    let msg = "Research synthesis failed";
    if (error instanceof Anthropic.APIError) {
      msg = `AI service error (${error.status}). Try again in a moment.`;
    } else if (error instanceof Error) {
      msg = error.message;
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
