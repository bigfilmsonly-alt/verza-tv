import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("entitlements")
      .select("id, series_slug, created_at")
      .eq("user_id", user.id);

    if (error) {
      console.error("[entitlements] DB error:", error.message);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    return Response.json({ entitlements: data ?? [] });
  } catch (err) {
    console.error("[entitlements] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
