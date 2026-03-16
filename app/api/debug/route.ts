export const dynamic = "force-dynamic";

export async function GET() {
  // Find any env var keys containing "HUBSPOT" (names only, not values)
  const hubspotKeys = Object.keys(process.env).filter((k) =>
    k.toUpperCase().includes("HUBSPOT")
  );

  // Check for common Railway-injected vars to confirm we're in Railway
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

  return Response.json({
    hasToken: !!process.env.HUBSPOT_ACCESS_TOKEN,
    tokenLength: process.env.HUBSPOT_ACCESS_TOKEN?.length ?? 0,
    tokenType: typeof process.env.HUBSPOT_ACCESS_TOKEN,
    hubspotEnvKeys: hubspotKeys,
    nodeEnv: process.env.NODE_ENV,
    isRailway,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT ?? null,
    railwayService: process.env.RAILWAY_SERVICE_NAME ?? null,
    totalEnvKeys: Object.keys(process.env).length,
  });
}
