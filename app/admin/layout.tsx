import { requireAdminPage } from "@/lib/admin";

// Force dynamic rendering: the admin gate reads the cookie session per request,
// so these pages must never be statically prerendered.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate (defense-in-depth in front of the API Bearer check):
  // a non-admin cookie session is redirected to '/' before any /admin/* page
  // renders. The API routes still enforce their own Bearer + allowlist check.
  await requireAdminPage();

  // Admin pages bypass the iPhone frame + Header/Footer/BottomNav
  // by rendering children directly. The root layout still wraps,
  // but this layout uses a CSS class to hide the consumer chrome.
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}
