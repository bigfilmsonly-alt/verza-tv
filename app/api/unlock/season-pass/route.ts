/**
 * The coin ledger and atomic season-pass purchase transaction do not exist.
 * Keep this legacy endpoint explicitly fail-closed so it can never be mistaken
 * for a working entitlement path or revived by uncommenting stub code.
 */
export async function POST() {
  return Response.json(
    { error: "Coin season passes are not available" },
    { status: 501 },
  );
}
