/**
 * Creator-paid titles are not currently live. Keep the endpoint fail-closed
 * until creator checkout has the same authenticated ownership and fulfillment
 * guarantees as catalog purchases.
 */
export async function POST() {
  return Response.json(
    { error: "Creator purchases are temporarily unavailable" },
    { status: 503 },
  );
}
