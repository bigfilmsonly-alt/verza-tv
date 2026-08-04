import { NextRequest } from "next/server";

const RETURN_SCHEME = "verzatv://checkout-return";

/**
 * Fixed HTTPS bridge used only as Stripe's native Checkout success/cancel URL.
 * It carries no authority: the app still verifies the Checkout session through
 * an authenticated API endpoint before changing access.
 */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const kind = request.nextUrl.searchParams.get("kind");
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (
    (status !== "success" && status !== "cancel") ||
    (kind !== "series" && kind !== "vip") ||
    (status === "success" &&
      (!sessionId?.startsWith("cs_") || sessionId.length > 255))
  ) {
    return new Response("Invalid checkout return", { status: 400 });
  }

  const appUrl = `${RETURN_SCHEME}?status=${status}&kind=${kind}`;
  const heading = status === "success" ? "Payment complete" : "Checkout canceled";
  const detail =
    status === "success"
      ? "Return to Verza TV to securely verify your purchase."
      : "No access change was made. Return to Verza TV when you're ready.";

  // appUrl, heading, and detail are built exclusively from fixed literals and
  // the strict allowlists above; no request data is reflected into this HTML.
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta http-equiv="refresh" content="0;url=${appUrl}" />
    <title>${heading} · Verza TV</title>
    <style>
      html,body{height:100%;margin:0;background:#07070e;color:#f7f7fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      body{display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center}
      main{max-width:420px}h1{font-size:24px;margin:0 0 12px}p{color:#b8b8c5;line-height:1.5;margin:0 0 24px}
      a{display:inline-block;border-radius:12px;padding:14px 20px;background:#e0115f;color:#fff;text-decoration:none;font-weight:700}
    </style>
  </head>
  <body>
    <main>
      <h1>${heading}</h1>
      <p>${detail}</p>
      <a href="${appUrl}">Return to Verza TV</a>
    </main>
    <script>window.location.replace(${JSON.stringify(appUrl)});</script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}
