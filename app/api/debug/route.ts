export async function GET() {
  return Response.json({
    hasToken: !!process.env.HUBSPOT_ACCESS_TOKEN,
    tokenLength: process.env.HUBSPOT_ACCESS_TOKEN?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
  });
}
