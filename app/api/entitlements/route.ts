import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { privateJson } from "@/lib/private-json";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return privateJson({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("entitlements")
      // Table column is granted_at (see migrations); alias keeps the
      // response shape stable for existing consumers.
      .select("id, series_slug, created_at:granted_at")
      .eq("user_id", user.id);

    if (error) {
      console.error("[entitlements] DB error:", error.message);
      return privateJson({ error: "Internal server error" }, { status: 500 });
    }

    return privateJson({ entitlements: data ?? [] });
  } catch (err) {
    console.error("[entitlements] Error:", err);
    return privateJson({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  return privateJson({ error: "Method not allowed" }, { status: 405 });
}
