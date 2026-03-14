const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY!;
const BASE_URL = "https://api.hubapi.com";

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
  meddic: MeddicScore;
  contacts: ContactInfo[];
  nda: string;
  msa: string;
  sow: string;
  credit: string;
  bizdev: string;
  partner: string;
  hasResearch: boolean;
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

function parseSection(description: string, tag: string): string {
  const regex = new RegExp(`\\[${tag}\\]\\s*(.+?)(?:\\n|$)`, "i");
  const match = description.match(regex);
  return match ? match[1].trim() : "";
}

function parseMeddic(description: string): MeddicScore {
  const raw = parseSection(description, "MEDDIC");
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
    else if (k === "decisioncriteria") defaults.decisionCriteria = val || "";
    else if (k === "decisionprocess") defaults.decisionProcess = val || "";
    else if (k === "identifypain") defaults.identifyPain = val || "";
    else if (k === "champion") defaults.champion = val || "";
  }
  return defaults;
}

function parseDocs(description: string): DealDocs {
  const raw = parseSection(description, "DOCS");
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
  const raw = parseSection(description, "CONTACTS");
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
  const persona = parseSection(description, "PERSONA");
  const hasResearch = parseSection(description, "RESEARCH").toLowerCase() === "true";
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
    meddic,
    contacts,
    ...docs,
    hasResearch,
    action1,
    action2,
    hsId: deal.id,
    description,
  };
}

export async function fetchAllDeals(): Promise<ParsedDeal[]> {
  let allResults: { id: string; properties: Record<string, string> }[] = [];
  let after: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: "100",
      properties: DEAL_PROPERTIES.join(","),
    });
    if (after) params.set("after", after);

    const res = await fetch(`${BASE_URL}/crm/v3/objects/deals?${params}`, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HubSpot API error: ${res.status}`);
    }

    const data = await res.json();
    allResults = allResults.concat(data.results || []);
    after = data.paging?.next?.after;
  } while (after);

  return allResults
    .filter((deal) => {
      const ownerId = deal.properties.hubspot_owner_id;
      return TRACKED_OWNER_IDS.includes(ownerId);
    })
    .map(parseDealFromHubSpot);
}

export async function fetchDealById(id: string): Promise<ParsedDeal> {
  const res = await fetch(
    `${BASE_URL}/crm/v3/objects/deals/${id}?properties=${DEAL_PROPERTIES.join(",")}`,
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
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
      Authorization: `Bearer ${HUBSPOT_API_KEY}`,
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
      Authorization: `Bearer ${HUBSPOT_API_KEY}`,
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

export { STAGE_MAP, OWNER_MAP, TRACKED_OWNER_IDS };
