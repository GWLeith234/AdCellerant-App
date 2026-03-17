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
      system: `You are a senior sales intelligence analyst. Produce a structured deal research brief based on all available deal context and notes. Be specific, actionable, and direct. Reference actual data from the deal context.`,
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

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
    }

    const parsed = JSON.parse(content.text);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Research synthesis error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
