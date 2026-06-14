export async function GET() {
  // Stub: return empty entitlements
  return Response.json({ entitlements: [] });
}

export async function POST() {
  // Stub: would grant entitlement after coin deduction
  return Response.json({
    success: false,
    error: "Coin purchase not yet wired (Phase 3)",
  });
}
