# Dev Report — Amazon Affiliate Shop

**Date:** 2026-07-13
**Status:** Shipped and live on [verzatv.com](https://www.verzatv.com)
**Branch:** `amazon-shop` → merged to `main`
**Operations guide:** [`../guides/AMAZON-SHOP.md`](../guides/AMAZON-SHOP.md)

---

## Summary

Replaced the placeholder TikTok Shop products with a real Amazon affiliate
storefront (Associates tag `verzatv-20`), built the in-app shopping flow around
it, then — after seeing it in place — pulled products **out** of the browsing
experience entirely and consolidated them onto the Shop tab.

The end state: **posters are just posters, search is just shows, the footer is
clean, and everything for sale lives on `/shop`.**

| | |
| --- | --- |
| Products | 12 (beauty, skincare, dresses, cozy) |
| Affiliate tag | `verzatv-20`, verified present on every outbound link |
| Prices displayed | **None** — deliberate, see below |
| Where products render | `/shop` and `/amazon` only |
| Checkout | On Amazon (non-negotiable, see below) |

---

## What shipped

**The Verza bag.** Shoppers browse products, open an in-app product card, and add
to a bag **without ever leaving Verza TV**. One button then pushes the *entire
bag* into their real Amazon cart in a single trip, tagged to `verzatv-20`. The
bag persists in `localStorage` across navigation and reloads.

**Two storefronts.** An "Amazon Picks" section on `/shop` beneath the VERZA merch,
and `/amazon` as the full store behind "View all".

**Background-removed product photos.** A Python pipeline
(`scripts/amazon-cutouts.py`) that cuts the white studio backdrop out of each
Amazon photo, so the cards can be any colour. 11 clean cutouts, 1 lifestyle shot
correctly passed through.

**Deleted, not disabled:** `lib/sponsors.ts` and `components/SponsoredProducts.tsx`
(the TikTok Shop implementation).

---

## Decisions, and why

### Buying inside the app is impossible. We built the closest legal thing.

The request was to let people purchase inside Verza TV. **Amazon does not permit
it.** Affiliates get no checkout API, the Associates agreement requires the
purchase to complete on `amazon.com` (that is how commission is attributed), and
Amazon pages cannot be framed.

So the whole shopping experience is ours — browse, product card, bag, quantities
— and only the payment is Amazon's. Verified against the real endpoint: our URL
redirects into Amazon's official Associates add-to-cart flow
(`openid.assoc_handle=amzn_associates_add_to_cart_us`) with the tag and every
ASIN and quantity intact.

### No prices anywhere.

Amazon's Associates agreement only permits displaying prices sourced from the
Product Advertising API and refreshed at least every 24 hours. A hardcoded price
is a terms violation *and* wrong within a week. Amazon also renders prices
dynamically, so they could not be scraped reliably even if we wanted to.

The site shows no price. Shoppers see the live one on Amazon.

### Product images come from the CDN, not the Associates widget.

The natural choice — Amazon's own `AsinImage` widget — is served from
`ws-na.amazon-adsystem.com`, an **ad-network domain**. Ad blockers drop it. We
observed exactly this: blank product cards, while the browser's blocker was
simultaneously eating our own Vercel analytics scripts.

Switched to `m.media-amazon.com`, the plain CDN. No blocker touches it, and it is
faster. Product photos now survive an ad blocker — verified with one active.

### Footer product links point inward, not at Amazon.

While products were briefly listed in the footer, the links went to our own store
pages rather than to Amazon. The footer renders on **every page**, so pointing a
dozen affiliate links at Amazon from there would have put unmarked affiliate links
sitewide — and the footer renders external links with `rel="noopener noreferrer"`,
missing the `rel="sponsored"` Google requires on paid links. That is a textbook
manual-action trigger.

### Products were removed from the poster grid and search.

Originally the sponsored rows were injected into the poster grid every 12 tiles,
and products surfaced in search. Once live, that made the app read as an ad. They
were pulled out of both. Browsing is now purely editorial.

---

## Bugs found and fixed

These are the ones that would have shipped broken. Each was caught by actually
exercising the thing, not by reading it.

### 1. Product images were invisible to anyone with an ad blocker

**Symptom:** blank product cards.
**Cause:** the Associates image widget lives on `ws-na.amazon-adsystem.com`, an
ad-network domain that blockers drop.
**Fix:** serve from `m.media-amazon.com`.
**Why it mattered:** a large share of users run a blocker. The shop would have
been imageless for them, and nobody would have reported it.

### 2. The cutout script silently removed nothing

**Symptom:** rerunning the image pipeline produced 12 products with their white
backgrounds back, reporting `0.0%` removed — while claiming success.
**Cause:** while tidying the script for commit, an `ImageDraw.Draw(mask)` line
that looked unused was deleted. It was load-bearing. `Image.fromarray` returns an
image still backed by the numpy buffer, and flood fill's writes do not survive the
trip back out.
**Fix:** `.copy()` to detach from the buffer, **plus a guard that aborts loudly**
if nothing is removed. An explicit `.load()` does *not* fix it.
**Why it mattered:** caught only because the script was run rather than trusted.

### 3. Deep links did nothing for anyone already on the store page

**Symptom:** tapping a product link changed the URL and opened nothing.
**Cause:** the obvious `/amazon#product-id` anchor approach **does not work in
Next.js** — `<Link>` performs a same-page navigation via `history.pushState`,
which (unlike a real hash navigation) fires **no `hashchange` event**.
**Fix:** a query param (`/amazon?p=<id>`), which Next exposes reactively via
`useSearchParams`, Suspense-wrapped so the page stays statically rendered.

### 4. …and then the opener still did not fire

**Symptom:** even after the fix, nothing opened.
**Cause:** the open was deferred with `requestAnimationFrame`, which **does not run
in a tab that is not painting**. Anyone middle-clicking a product into a
background tab would have found nothing there.
**Fix:** `setTimeout`, which runs regardless of visibility.

### 5. The floating bag pill slid under the bottom nav on desktop

**Cause:** on desktop the nav is docked *inside* the simulated iPhone frame, while
the pill was fixed to the *viewport*. They did not line up, and the nav (z-50)
painted over the pill (z-40).
**Fix:** anchor the bag to the frame on desktop via a container-scoped CSS layer,
and lift it above the nav.

### 6. The bag persistence effect wiped the saved bag on mount

**Cause:** a `useEffect` on `[items]` fired on first render with the empty initial
state and wrote it over the stored bag **before** the rehydrate landed.
**Fix:** removed the persistence effect entirely; state and storage now move
together through a single `commit()` write path. Verified by reloading with items
in the bag.

### 7. The headline could not hold one line at any fixed font size

**Cause:** "Your favorite shows, your favorite finds" is 39 characters and renders
~19.2× the font size wide. 18px fits a 390px iPhone but overflows a 360px Android;
anything small enough for a 320px SE stops reading as a headline.
**Fix:** container query units. **Not** viewport units — inside the desktop iPhone
frame the viewport is the whole browser window while the frame is 400px, so `vw`
would blow the text up. Measured 288px→408px containers: always one line, ≥11px
clearance, scaling 14.4px→20px.

> **A near-miss worth recording.** The first overflow check used `scrollWidth`,
> which **lies for a non-scrolling block** — it reports the element's own width,
> not the overflowing text — and cheerfully reported that everything fit. A
> screenshot looked tight, and re-measuring the real text with a `Range` gave the
> honest numbers.

---

## Verification performed

All of the following was checked against **the live domain**, not just locally.

| Check | Result |
| --- | --- |
| Cart handoff hits Amazon's real Associates flow, tag + all ASINs + quantities intact | ✅ |
| Affiliate tag `verzatv-20` on every outbound link | ✅ |
| All 12 product images load; **0 broken** | ✅ |
| Product photos survive an active ad blocker | ✅ |
| Bag persists across navigation and a full reload | ✅ |
| Bag adds → drawer → multi-item handoff URL correct | ✅ |
| Poster grid: 76 posters, **0 products** | ✅ |
| Search for "amazon" / "mascara": shows only, **0 products** | ✅ |
| Footer on `/`, `/shorts`, `/library`, `/contact`, `/shop`, `/amazon`: **0 products** | ✅ |
| TikTok *products* gone; the `@verzatv` social link correctly kept | ✅ |
| Headline holds one line from a 320px SE to a 440px shell | ✅ |
| Typecheck, production build | ✅ clean |

---

## Deliberately not done

- **Live prices.** Would require PA-API, which Amazon gates behind three
  qualifying sales. Until then, no prices is the only compliant option.
- **In-app checkout.** Not possible. See above.
- **Merging the Amazon bag into the Stripe cart.** They are different payment
  paths and must stay separate.

---

## Open items

- **Product images are static snapshots.** They no longer follow Amazon. If a
  seller swaps their main photo, rerun `scripts/amazon-cutouts.py`.
- **Modified product images.** The cutouts are altered copies of Amazon's photos,
  served from our own domain. This is common practice among affiliates and the
  enforcement risk is low, but Amazon's image licence contemplates *resizing*
  rather than altering. Flagged for the account owner's awareness; reverting to
  unmodified photos on a light card is a small change.
- **`/amazon` is thin affiliate content** for SEO purposes. It canonicalises to
  itself and is in the sitemap at low priority. Not a traffic play.
- **Product cards are white.** The transparent cutouts were kept even though white
  makes them invisible, so switching to a brand-coloured or gradient card later is
  a one-line change rather than a re-shoot.

---

## Commits

| | |
| --- | --- |
| `ad6194d` | Replace TikTok Shop products with the Amazon affiliate store |
| `87b4b2e` | Move products out of the poster grid into a visible footer shop, on white |
| `327ab97` | Products live on /shop only; none in the footer |
| `09e2ac2` | Sell the shop instead of naming the retailer |
| `939492b` | Hold the shop headline to a single line at every width |
