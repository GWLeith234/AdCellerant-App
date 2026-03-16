import { NextResponse } from "next/server";

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY || "";
const BASE_URL = "https://api.hubapi.com";

const CUSTOM_PROPERTIES = [
  {
    name: "persona_type",
    label: "Persona Type",
    type: "enumeration",
    fieldType: "select",
    groupName: "dealinformation",
    options: [
      { label: "Partner Media", value: "partner_media", displayOrder: 1 },
      { label: "Partner Agency", value: "partner_agency", displayOrder: 2 },
      { label: "Enterprise Brand", value: "enterprise_brand", displayOrder: 3 },
      { label: "Vendasta", value: "vendasta", displayOrder: 4 },
    ],
  },
  {
    name: "revenue_line",
    label: "Revenue Line",
    type: "enumeration",
    fieldType: "select",
    groupName: "dealinformation",
    options: [
      { label: "Canada", value: "canada", displayOrder: 1 },
      { label: "Vendasta", value: "vendasta", displayOrder: 2 },
      { label: "UK", value: "uk", displayOrder: 3 },
    ],
  },
];

async function createProperty(property: (typeof CUSTOM_PROPERTIES)[number]) {
  const res = await fetch(`${BASE_URL}/crm/v3/properties/deals`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(property),
  });

  if (res.status === 409) {
    return { name: property.name, status: "already_exists" };
  }

  if (!res.ok) {
    const err = await res.text();
    return { name: property.name, status: "error", error: err };
  }

  return { name: property.name, status: "created" };
}

export async function POST() {
  try {
    const results = await Promise.all(CUSTOM_PROPERTIES.map(createProperty));
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
