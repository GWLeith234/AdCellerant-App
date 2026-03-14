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

const STAGE_MAP: Record<string, { category: string; probability: number }> = {
  appointmentscheduled: { category: "leads", probability: 25 },
  qualifiedtobuy: { category: "leads", probability: 25 },
  presentationscheduled: { category: "prop", probability: 50 },
  decisionmakerboughtin: { category: "neg", probability: 75 },
  closedwon: { category: "cw", probability: 100 },
};

const OWNER_MAP: Record<string, string> = {
  "78947458": "george",
  "80955316": "andy",
};

export interface HubSpotDeal {
  id: string;
  dealname: string;
  dealstage: string;
  amount: number;
  closedate: string;
  hubspot_owner_id: string;
  hs_lastmodifieddate: string;
  description: string;
  hs_deal_stage_probability: number;
  createdate: string;
  notes_last_updated: string;
  category: string;
  rep: string;
}

export async function fetchDeals(): Promise<HubSpotDeal[]> {
  const res = await fetch(
    `${BASE_URL}/crm/v3/objects/deals?limit=100&properties=${DEAL_PROPERTIES.join(",")}`,
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

  const data = await res.json();

  return data.results.map((deal: { id: string; properties: Record<string, string> }) => {
    const props = deal.properties;
    const stageInfo = STAGE_MAP[props.dealstage] || {
      category: "unknown",
      probability: 0,
    };
    return {
      id: deal.id,
      dealname: props.dealname || "",
      dealstage: props.dealstage || "",
      amount: parseFloat(props.amount) || 0,
      closedate: props.closedate || "",
      hubspot_owner_id: props.hubspot_owner_id || "",
      hs_lastmodifieddate: props.hs_lastmodifieddate || "",
      description: props.description || "",
      hs_deal_stage_probability:
        parseFloat(props.hs_deal_stage_probability) || stageInfo.probability,
      createdate: props.createdate || "",
      notes_last_updated: props.notes_last_updated || "",
      category: stageInfo.category,
      rep: OWNER_MAP[props.hubspot_owner_id] || "unknown",
    };
  });
}

export { STAGE_MAP, OWNER_MAP };
