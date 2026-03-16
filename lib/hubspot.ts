// Read token at request time, not module init, so Railway runtime vars are picked up
function getToken(): string {
  return process.env.HUBSPOT_ACCESS_TOKEN || "";
}
const BASE_URL = "https://api.hubspot.com";

const DEAL_PROPERTIES = [
  "dealname",
  "dealstage",
  "amount",
  "closedate",
  "hubspot_owner_id",
  "hs_lastmodifieddate",
  "description",
  "hs_deal_stage_probability",
  "createdate",
  "notes_last_updated",
  "persona_type",
  "revenue_line",
];

const STAGE_MAP: Record<string, { category: string; probability: number; label: string; stageClass: string }> = {
  appointmentscheduled: { category: "leads", probability: 25, label: "Appointment Scheduled", stageClass: "stage-lead" },
  qualifiedtobuy: { category: "leads", probability: 25, label: "Qualified to Buy", stageClass: "stage-lead" },
  presentationscheduled: { category: "prop", probability: 50, label: "Presentation Scheduled", stageClass: "stage-prop" },
  decisionmakerboughtin: { category: "neg", probability: 75, label: "Decision Maker Bought In", stageClass: "stage-neg" },
  closedwon: { category: "cw", probability: 100, label: "Closed Won", stageClass: "stage-cw" },
};

const OWNER_MAP: Record<string, string> = {
  "78947458": "george",
  "80955316": "andy",
  "83471854": "alex",
};

// All owner IDs we want to fetch deals for
const TRACKED_OWNER_IDS = Object.keys(OWNER_MAP);

export interface ContactInfo {
  name: string;
  role: string;
  initials: string;
}

export interface DealDocs {
  nda: string;
  msa: string;
  sow: string;
  credit: string;
  bizdev: string;
  partner: string;
}

export interface MeddicScore {
  metrics: string;
  econBuyer: string;
  decisionCriteria: string;
  decisionProcess: string;
  identifyPain: string;
  champion: string;
}

export interface ParsedDeal {
  id: string;
  name: string;
  sub: string;
  val: number;
  valShort: string;
  rep: string;
  stage: string;
  stageClass: string;
  cat: string;
  closeDate: string;
  stageAge: number;
  persona: string;
  revenueLine: string;
  meddic: MeddicScore;
  contacts: ContactInfo[];
  nda: string;
  msa: string;
  sow: string;
  credit: string;
  bizdev: string;
  partner: string;
  hasResearch: boolean;
  researchNotes: string;
  action1: string;
  action2: string;
  hsId: string;
  description: string;
}

function formatValShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

// --- Stage block parser ---
// Splits description into stage blocks: [STAGE N — DATE] ... content ...
// Returns array of { stageNum, date, content } sorted by stageNum ascending.
// The "latest" block is the last one (highest stage number).

interface StageBlock {
  stageNum: number;
  date: string;
  content: string;
}

function parseStageBlocks(description: string): StageBlock[] {
  if (!description) return [];

  const blockRegex = /\[STAGE\s+(\d+)\s*[—–-]\s*(\d{4}-\d{2}-\d{2})\]/gi;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(description)) !== null) {
    matches.push(m);
  }

  if (matches.length === 0) {
    // Legacy format: treat entire description as a single block
    return [{ stageNum: 0, date: "", content: description }];
  }

  const blocks: StageBlock[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : description.length;
    blocks.push({
      stageNum: parseInt(match[1], 10),
      date: match[2],
      content: description.slice(start, end).trim(),
    });
  }

  return blocks.sort((a, b) => a.stageNum - b.stageNum);
}

// Extract a [TAG] value from a stage block's content (first line only for structured tags)
function parseSection(content: string, tag: string): string {
  const regex = new RegExp(`\\[${tag}\\]\\s*(.+?)(?:\\n|$)`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

// Get the latest stage block content, or entire description for legacy format
function getLatestBlockContent(description: string): string {
  const blocks = parseStageBlocks(description);
  if (blocks.length === 0) return "";
  return blocks[blocks.length - 1].content;
}

// Extract freeform research notes from all stage blocks.
// Research notes are text after the structured tag lines and "---" separator.
function extractResearchNotes(description: string): string {
  const blocks = parseStageBlocks(description);
  const notes: string[] = [];

  for (const block of blocks) {
    // Split content by "---" separator — freeform text is after it
    const separatorIdx = block.content.indexOf("---");
    if (separatorIdx >= 0) {
      const freeform = block.content.slice(separatorIdx + 3).trim();
      if (freeform) {
        const header = block.date ? `[Stage ${block.stageNum} — ${block.date}]` : "";
        notes.push(header ? `${header}\n${freeform}` : freeform);
      }
    }
  }

  return notes.join("\n\n");
}

function parseMeddic(description: string): MeddicScore {
  const latestContent = getLatestBlockContent(description);
  const raw = parseSection(latestContent, "MEDDIC");
  const defaults: MeddicScore = {
    metrics: "",
    econBuyer: "",
    decisionCriteria: "",
    decisionProcess: "",
    identifyPain: "",
    champion: "",
  };
  if (!raw) return defaults;

  const pairs = raw.split("|").map((p) => p.trim());
  for (const pair of pairs) {
    const [key, val] = pair.split(":").map((s) => s.trim());
    const k = key?.toLowerCase();
    if (k === "metrics") defaults.metrics = val || "";
    else if (k === "econbuyer") defaults.econBuyer = val || "";
    else if (k === "criteria") defaults.decisionCriteria = val || "";
    else if (k === "decisioncriteria") defaults.decisionCriteria = val || "";
    else if (k === "process") defaults.decisionProcess = val || "";
    else if (k === "decisionprocess") defaults.decisionProcess = val || "";
    else if (k === "pain") defaults.identifyPain = val || "";
    else if (k === "identifypain") defaults.identifyPain = val || "";
    else if (k === "champion") defaults.champion = val || "";
  }
  return defaults;
}

function parseDocs(description: string): DealDocs {
  const latestContent = getLatestBlockContent(description);
  const raw = parseSection(latestContent, "DOCS");
  const defaults: DealDocs = {
    nda: "",
    msa: "",
    sow: "",
    credit: "",
    bizdev: "",
    partner: "",
  };
  if (!raw) return defaults;

  const pairs = raw.split("|").map((p) => p.trim());
  for (const pair of pairs) {
    const [key, val] = pair.split(":").map((s) => s.trim());
    const k = key?.toLowerCase();
    if (k && k in defaults) {
      (defaults as unknown as Record<string, string>)[k] = val || "";
    }
  }
  return defaults;
}

function parseContacts(description: string): ContactInfo[] {
  const latestContent = getLatestBlockContent(description);
  const raw = parseSection(latestContent, "CONTACTS");
  if (!raw) return [];

  return raw.split(",").map((c) => {
    const parts = c.trim().split("|").map((s) => s.trim());
    return {
      name: parts[0] || "",
      role: parts[1] || "",
      initials: parts[2] || (parts[0] || "").split(" ").map((w) => w[0]).join("").toUpperCase(),
    };
  }).filter((c) => c.name);
}

function determineActions(cat: string, docs: DealDocs, meddic: MeddicScore): [string, string] {
  if (cat === "leads") {
    if (!meddic.identifyPain) return ["Identify Pain Points", "Schedule Discovery"];
    return ["Qualify Budget", "Book Presentation"];
  }
  if (cat === "prop") {
    if (!docs.nda) return ["Send NDA", "Prepare Proposal"];
    return ["Follow Up Proposal", "Confirm Decision Maker"];
  }
  if (cat === "neg") {
    if (!docs.msa) return ["Draft MSA", "Negotiate Terms"];
    if (!docs.sow) return ["Prepare SOW", "Get Signature"];
    return ["Final Review", "Close Deal"];
  }
  return ["Review Deal", "Update Status"];
}

const PERSONA_LABELS: Record<string, string> = {
  partner_media: "Partner Media",
  partner_agency: "Partner Agency",
  enterprise_brand: "Enterprise Brand",
  vendasta: "Vendasta",
};

const REVENUE_LINE_LABELS: Record<string, string> = {
  canada: "Canada",
  vendasta: "Vendasta",
  uk: "UK",
};

function formatPersonaType(val: string): string {
  return PERSONA_LABELS[val] || val;
}

function formatRevenueLine(val: string): string {
  return REVENUE_LINE_LABELS[val] || val;
}

export function parseDealFromHubSpot(deal: {
  id: string;
  properties: Record<string, string>;
}): ParsedDeal {
  const props = deal.properties;
  const description = props.description || "";
  const stageInfo = STAGE_MAP[props.dealstage] || {
    category: "unknown",
    probability: 0,
    label: props.dealstage || "Unknown",
    stageClass: "stage-unknown",
  };

  const val = parseFloat(props.amount) || 0;
  const docs = parseDocs(description);
  const meddic = parseMeddic(description);
  const contacts = parseContacts(description);
  const latestContent = getLatestBlockContent(description);

  // Persona: prefer custom property, fall back to description tag
  const persona = props.persona_type
    ? formatPersonaType(props.persona_type)
    : parseSection(latestContent, "PERSONA");

  // Revenue line from custom property
  const revenueLine = props.revenue_line
    ? formatRevenueLine(props.revenue_line)
    : "";

  const hasResearch = parseSection(latestContent, "RESEARCH").toLowerCase() === "true";
  const researchNotes = extractResearchNotes(description);
  const [action1, action2] = determineActions(stageInfo.category, docs, meddic);

  const dealName = props.dealname || "";
  const nameParts = dealName.split(" - ");

  return {
    id: deal.id,
    name: nameParts[0] || dealName,
    sub: nameParts.slice(1).join(" - ") || "",
    val,
    valShort: formatValShort(val),
    rep: OWNER_MAP[props.hubspot_owner_id] || "unknown",
    stage: stageInfo.label,
    stageClass: stageInfo.stageClass,
    cat: stageInfo.category,
    closeDate: props.closedate || "",
    stageAge: daysSince(props.hs_lastmodifieddate),
    persona,
    revenueLine,
    meddic,
    contacts,
    ...docs,
    hasResearch,
    researchNotes,
    action1,
    action2,
    hsId: deal.id,
    description,
  };
}

export async function fetchAllDeals(): Promise<ParsedDeal[]> {
  const res = await fetch(`${BASE_URL}/crm/v3/objects/deals/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "hubspot_owner_id",
              operator: "IN",
              values: TRACKED_OWNER_IDS,
            },
            {
              propertyName: "pipeline",
              operator: "EQ",
              value: "default",
            },
            {
              propertyName: "dealstage",
              operator: "NOT_IN",
              values: ["closedwon", "closedlost"],
            },
          ],
        },
      ],
      properties: DEAL_PROPERTIES,
      limit: 100,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HubSpot API error: ${res.status} — ${body}`);
  }

  const data = await res.json();
  return (data.results || []).map(parseDealFromHubSpot);
}

export async function fetchDealById(id: string): Promise<ParsedDeal> {
  const res = await fetch(
    `${BASE_URL}/crm/v3/objects/deals/${id}?properties=${DEAL_PROPERTIES.join(",")}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`HubSpot API error: ${res.status}`);
  }

  const deal = await res.json();
  return parseDealFromHubSpot(deal);
}

export async function updateDeal(
  id: string,
  properties: Record<string, string>
): Promise<ParsedDeal> {
  const res = await fetch(`${BASE_URL}/crm/v3/objects/deals/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    throw new Error(`HubSpot update error: ${res.status}`);
  }

  const deal = await res.json();
  return parseDealFromHubSpot(deal);
}

export async function addNoteToDeal(dealId: string, noteBody: string): Promise<void> {
  // Create the note engagement
  const res = await fetch(`${BASE_URL}/crm/v3/objects/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        hs_note_body: noteBody,
        hs_timestamp: new Date().toISOString(),
      },
      associations: [
        {
          to: { id: dealId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 214,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`HubSpot note error: ${res.status}`);
  }
}

export async function appendResearchNote(dealId: string, note: string): Promise<string> {
  // Fetch current description
  const res = await fetch(
    `${BASE_URL}/crm/v3/objects/deals/${dealId}?properties=description`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`HubSpot fetch error: ${res.status}`);
  }

  const deal = await res.json();
  const currentDesc = deal.properties.description || "";
  const timestamp = new Date().toISOString().split("T")[0];
  const timestampedNote = `[${timestamp}] ${note}`;

  // Determine where to append:
  // If there are stage blocks, append inside the last block's freeform area.
  // If no stage blocks, just append at the end.
  let newDesc: string;
  const blocks = parseStageBlocks(currentDesc);
  const lastBlock = blocks[blocks.length - 1];

  if (lastBlock && lastBlock.stageNum > 0) {
    // Find the last stage block in the raw text and append after its content
    const lastStageRegex = new RegExp(
      `(\\[STAGE\\s+${lastBlock.stageNum}\\s*[—–-]\\s*${lastBlock.date}\\])`,
      "i"
    );
    const match = currentDesc.match(lastStageRegex);
    if (match && match.index !== undefined) {
      const blockStart = match.index + match[0].length;
      // Find the content section — look for "---" separator
      const afterBlock = currentDesc.slice(blockStart);
      const sepIdx = afterBlock.indexOf("---");
      if (sepIdx >= 0) {
        // Append after existing freeform content
        const insertPos = blockStart + afterBlock.length;
        newDesc = currentDesc.slice(0, insertPos).trimEnd() + "\n" + timestampedNote + "\n";
      } else {
        // No separator yet — add one and the note
        newDesc = currentDesc.trimEnd() + "\n---\n" + timestampedNote + "\n";
      }
    } else {
      newDesc = currentDesc.trimEnd() + "\n\n" + timestampedNote + "\n";
    }
  } else {
    // Legacy format or empty — just append
    newDesc = currentDesc
      ? currentDesc.trimEnd() + "\n\n---\n" + timestampedNote + "\n"
      : timestampedNote;
  }

  // Update the description
  const updateRes = await fetch(`${BASE_URL}/crm/v3/objects/deals/${dealId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties: { description: newDesc } }),
  });

  if (!updateRes.ok) {
    throw new Error(`HubSpot update error: ${updateRes.status}`);
  }

  return newDesc;
}

export { STAGE_MAP, OWNER_MAP, TRACKED_OWNER_IDS };
