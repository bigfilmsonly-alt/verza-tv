# Amazon Shop — Operations Guide

> The Amazon affiliate storefront. Associates tag **`verzatv-20`**.
> Live at [verzatv.com/shop](https://www.verzatv.com/shop) and [verzatv.com/amazon](https://www.verzatv.com/amazon).

This is the guide for keeping the shop running: adding products, refreshing
images, and the handful of constraints that will bite you if you do not know
them. For the story of how it was built and why, see
[`../reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md`](../reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md).

---

## Read this first: four constraints that are not negotiable

These are not style preferences. Each one is either an Amazon terms issue or a
thing that silently breaks in production.

### 1. Checkout can never happen inside the app

Amazon gives affiliates **no checkout API**, requires the purchase to complete on
`amazon.com` (that is the mechanism that attributes your commission), and
forbids framing its pages. There is no version of this where a shopper pays
inside Verza TV.

What we do instead is the closest the program allows: shoppers browse and build
a bag **entirely in the app**, and a single handoff pushes the whole bag into
their real Amazon cart. Only the payment happens on Amazon.

### 2. Never hardcode a price

The Associates agreement only permits displaying prices that come from the
Product Advertising API and are refreshed at least every 24 hours. A price typed
into a source file is both a terms violation and wrong within a week.

**The site displays no prices at all.** Shoppers see the live price on Amazon at
handoff. If you ever want prices on the site, the only compliant route is wiring
up PA-API (which Amazon gates behind three qualifying sales).

### 3. Product images must not come from the Associates image widget

The obvious way to show a product photo is Amazon's own `AsinImage` widget on
`ws-na.amazon-adsystem.com`. **Do not.** That is an ad-network domain, so every
ad blocker drops it and a large share of shoppers see empty product cards. We hit
this exactly.

Images come from `m.media-amazon.com`, the plain CDN, which no blocker touches.

### 4. The product cards are white, and the cutouts are why

Amazon shoots every product on a white studio sweep and **bakes that white into
the JPEG**. The cards are currently white, so the cutouts are invisible — but
they are what makes any other card colour possible. Recolour the card without
them and you get a white slab floating on it.

No CSS blend mode can rescue that, because a white *backdrop* pixel and a white
*product* pixel (the eos bottle, the Mighty Patch box) are the same colour. Only
segmentation can tell them apart. See [Refreshing the images](#refreshing-the-images).

---

## Where products appear (and deliberately do not)

| Surface | Products? |
| --- | --- |
| `/shop` — "Your favorite shows, your favorite finds" section, under the VERZA merch | **Yes** — all 12 |
| `/amazon` — the full store, reached via "View all" | **Yes** — all 12 |
| Poster grid (Discover and every tab) | **No** — posters only, on purpose |
| Search results | **No** — shows only, on purpose |
| Footer | **No** — on purpose |

Browsing is editorial. Everything for sale lives on the Shop tab. This was a
deliberate reversal: products were originally injected into the poster grid and
into search, and it made the whole app read as an ad.

The footer's sitemap "Shop" group links to both pages, and nothing else.

---

## File map

| File | Role |
| --- | --- |
| `lib/amazon-sponsors.ts` | **Single source of truth.** The catalog, plus every URL/image helper. Empty the array and all surfaces render nothing. |
| `lib/amazon-bag.tsx` | The Verza bag: React context + `localStorage` persistence (key `verza-amazon-bag`). |
| `components/AmazonProducts.tsx` | The product tile and the in-app product modal. |
| `components/AmazonBag.tsx` | The floating bag pill and the bag drawer. Mounted once, inside the device frame. |
| `components/AmazonDeepLink.tsx` | Opens a product from `/amazon?p=<id>`. |
| `app/shop/page.tsx` | The Shop tab. Merch, then the Amazon section. |
| `app/amazon/page.tsx` | The full store. |
| `scripts/amazon-cutouts.py` | Regenerates the background-removed product images. |
| `public/amazon/*.webp` | The generated images. 3 widths per product. |
| `app/globals.css` | `.amazon-bag-layer` (bag positioning), `.headline-oneline` (the one-line headline). |
| `lib/data/sitemap.ts` | The footer's Shop links. |

The old TikTok Shop equivalents (`lib/sponsors.ts`, `components/SponsoredProducts.tsx`)
were **deleted**, not disabled.

---

## Adding, removing or reordering a product

Everything flows from one array. To add a product:

**1. Get its ASIN and image ID from the Amazon product page.**

- **ASIN** — the 10-character code in the URL: `amazon.com/dp/`**`B08KT2Z93D`**
- **Image ID** — view the main product image and take the id out of its URL:
  `m.media-amazon.com/images/I/`**`61IQUadfGEL`**`._SL1500_.jpg`

**2. Add an entry to `AMAZON_PRODUCTS` in `lib/amazon-sponsors.ts`:**

```ts
{
  id: "amzn-my-product",          // unique; also the image filename and deep-link key
  title: "Short, readable name",  // NOT Amazon's keyword-stuffed title
  asin: "B0XXXXXXXX",             // powers the add-to-cart handoff
  imageId: "71XxxxxxxL",          // powers the photo
  cutout: true,                   // a local cutout exists (see step 3)
  url: "<your SiteStripe affiliate link, tag=verzatv-20>",
  icon: "skincare",               // placeholder glyph if the image ever fails
  accent: ["#EC4899", "#7C3AED"], // placeholder gradient
  badge: "Skincare",              // small category pill
  description: "One or two lines, shown in the product modal.",
},
```

**3. Regenerate the images** (see below). Without this, the tile falls back to a
gradient placeholder.

**4. Deploy.** No other file needs touching — `/shop`, `/amazon`, and the bag all
read from the same array.

To **remove** a product, delete its entry. To **reorder**, move it. The array
order is the display order on both pages.

> **Search links have no ASIN.** If you ever add a product whose `url` is an
> Amazon *search* rather than a product page, leave `asin` off. The tile will
> correctly offer "Shop on Amazon" instead of "Add to bag", because a search has
> no single product for Amazon to put in a cart. Prefer a real product link —
> a search link also cannot have an honest product photo.

---

## Refreshing the images

```bash
pip install pillow numpy
python3 scripts/amazon-cutouts.py
```

The script reads the catalog out of `lib/amazon-sponsors.ts`, pulls each master
image from Amazon's CDN, removes the white studio background, and writes
`public/amazon/<id>-{400,800,1200}.webp`.

**How the background removal works, and why it is done this way.** It flood-fills
the white **inward from the four corners**. That detail is the whole trick: a
naive "make every white pixel transparent" would punch holes straight through the
white products. Flooding from the edges can only ever eat the backdrop.

Lifestyle shots that are not on a white sweep (the sunset lamp) are detected from
their corners and passed through untouched.

Run it whenever you add a product, or if a seller swaps their main photo — the
images are static snapshots, so they do not follow Amazon automatically.

> **A trap, documented because it already caught us once.** Inside the script,
> `Image.fromarray(...).copy()` — the `.copy()` is **load-bearing**. Without it
> the image is still backed by the numpy buffer, flood fill's writes do not
> survive, and the script silently removes **nothing**, writing 12 products with
> their white backgrounds intact. An explicit `.load()` does *not* fix it. There
> is now a guard that aborts loudly if nothing is removed, but do not delete the
> `.copy()`.

---

## The bag and the cart handoff

Shoppers add products to a Verza-side bag (`lib/amazon-bag.tsx`), persisted in
`localStorage` so it survives navigation and reloads. The bag resolves stored ids
against the **live** catalog on load, so a product you retire cannot come back
from a stale bag in someone's browser.

The handoff builds one URL containing every item:

```
https://www.amazon.com/gp/aws/cart/add.html
  ?AssociateTag=verzatv-20
  &ASIN.1=B08KT2Z93D&Quantity.1=2
  &ASIN.2=B085P3TYPS&Quantity.2=1
```

Amazon redirects this into its official Associates add-to-cart flow and lands the
shopper on their cart with everything in it, attributed to `verzatv-20`.

> It **must stay a GET link** (an anchor or `window.open`). A form POST would be
> blocked by our own CSP, which pins `form-action` to `'self'` and Stripe.

---

## Two carts on one page

`/shop` has two payment paths and they must stay visibly separate:

- **VERZA merch** → our own **Stripe** cart (`lib/cart.tsx`)
- **Amazon products** → the **Verza bag** (`lib/amazon-bag.tsx`), settling on Amazon

They are deliberately different modules. Do not merge them — one charges the
customer directly, the other never touches money. The visual separation (divider,
its own heading, the Sponsored label) is what makes having both on one page
honest.

---

## Disclosure

Required by the FTC and by Amazon, and currently satisfied in three places:

1. A **`Sponsored · Amazon`** line under the headline on both pages, above the products.
2. **`Sponsored · Amazon`** under every single tile, plus an `Ad` badge on the image.
3. The **Associates disclosure** ("As an Amazon Associate, VERZA TV earns from
   qualifying purchases") below the grid and in the product modal.

The headline no longer says "Amazon". That is fine — and higher converting — only
because the labelling above is intact. If you strip that labelling, put the
retailer back in the header.

---

## Deploying

A `git push` builds a production-target deployment but does **not** promote the live domain. Only the Vercel CLI aliases `www.verzatv.com`:

```bash
npx vercel --prod --yes    # → verzatv.com
```
