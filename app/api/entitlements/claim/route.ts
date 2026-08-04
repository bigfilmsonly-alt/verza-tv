/**
 * Historical purchases keyed only by email cannot be claimed automatically:
 * this project's former auto-confirm setting means an auth session is not
 * cryptographic proof that the caller controls that mailbox. New checkouts are
 * authenticated and user-ID-bound. Support can recover the small historical
 * queue manually after independently verifying ownership.
 */
export async function POST() {
  return Response.json(
    { error: "Automatic purchase recovery is unavailable; contact support" },
    { status: 410 },
  );
}
