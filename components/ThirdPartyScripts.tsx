"use client";

import { useEffect } from "react";
import { isIOSApp } from "@/lib/platform";

/**
 * Loads GTM (GA4) and AdSense on the WEB only. Inside the iOS app these are
 * skipped entirely: Google's ad stack constitutes cross-context tracking,
 * which would require an App Tracking Transparency prompt and a "Data Used
 * to Track You" declaration — cleaner to simply not track in the app.
 */
export default function ThirdPartyScripts() {
  useEffect(() => {
    if (isIOSApp()) return;
    if (document.getElementById("verza-gtm")) return; // once per page load

    // Google Tag Manager (GA4 G-HY8HNR5DQD managed inside GTM-K9GWK2XT)
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const gtm = document.createElement("script");
    gtm.id = "verza-gtm";
    gtm.async = true;
    gtm.src = "https://www.googletagmanager.com/gtm.js?id=GTM-K9GWK2XT";
    document.head.appendChild(gtm);

    // Google AdSense
    const ads = document.createElement("script");
    ads.async = true;
    ads.crossOrigin = "anonymous";
    ads.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8089901381021947";
    document.head.appendChild(ads);
  }, []);

  return null;
}
