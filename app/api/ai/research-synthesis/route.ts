import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createMessageWithRetry } from "@/lib/ai-retry";

const SECTION_HEADERS = [
  "ACCOUNT INTELLIGENCE",
  "STAKEHOLDER READ",
  "MEDDIC ANALYSIS",
  "STAGE RISK ASSESSMENT",
  "RECOMMENDED NEXT MOVE",
  "OPEN QUESTIONS",
];

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

    console.log("=== RESEARCH API CALLED ===");
    console.log("Deal:", JSON.stringify(body).substring(0, 200));

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

    const message = await createMessageWithRetry({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: `You are an elite sales intelligence analyst. Return your analysis as plain text with these exact section headers on their own lines:

ACCOUNT INTELLIGENCE
[content]

STAKEHOLDER READ
[content]

MEDDIC ANALYSIS
[content]

STAGE RISK ASSESSMENT
[content]

RECOMMENDED NEXT MOVE
[content]

OPEN QUESTIONS
[content]

Be specific, actionable, and concise. 3-5 sentences per section. Reference the deal data provided. Do NOT use JSON. Do NOT use markdown formatting or code blocks.`,
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

Write the brief now using the exact section headers specified.`,
        },
      ],
    });

    // Extract text content
    console.log("=== RAW RESPONSE ===");
    console.log("Content blocks:", message.content?.length);
    message.content?.forEach((b, i) => {
      console.log(`Block ${i}: type=${b.type}`);
      if (b.type === "text") {
        console.log("Text preview:", b.text?.substring(0, 300));
      }
    });

    const textBlock = message.content?.find(
      (b: { type: string }) => b.type === "text"
    );

    if (!textBlock || textBlock.type !== "text" || !textBlock.text) {
      console.error("No text block in response:", JSON.stringify(message.content).substring(0, 500));
      return NextResponse.json({
        error: "No text content in AI response",
      }, { status: 500 });
    }

    const rawText = textBlock.text;

    // Parse plain text sections
    const sections: Record<string, string> = {};

    SECTION_HEADERS.forEach((header, i) => {
      const start = rawText.indexOf(header);
      if (start === -1) return;

      const contentStart = start + header.length;
      const nextHeader = SECTION_HEADERS[i + 1];
      const end = nextHeader
        ? rawText.indexOf(nextHeader)
        : rawText.length;

      sections[header] = rawText
        .substring(contentStart, end === -1 ? rawText.length : end)
        .trim();
    });

    console.log("Parsed sections:", Object.keys(sections));

    return NextResponse.json({
      success: true,
      sections,
      rawText,
    });
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
