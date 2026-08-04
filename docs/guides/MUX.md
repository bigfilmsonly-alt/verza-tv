# Mux playback, authorization, and signed-ID cutover

This is the authoritative runbook for catalog video delivery. It covers the
web client, the native reader client in sibling repo `../verza-native`, the
server authorization endpoint, the generated signed-ID inventory, and the
one-way production cutover. Read it before changing any Mux ID, playback URL,
entitlement gate, player cache, or release flag.

> **Production status, latest 2026-08-03 readback:**
> `MUX_SIGNED_PLAYBACK_ENABLED=true` is live. An unentitled paid request returns
> 402 with no capability. An entitled request returns `policy=signed`, omits
> `playbackId`, provides 1,800-second tokenized stream/poster URLs, and its HLS
> manifest returns 200. The disposable canary account/entitlement was deleted.
> Exact standalone native-client acceptance remains open, and legacy public IDs
> still coexist for live 1.2 compatibility.

## Launch invariants

1. Catalog-free episodes may use their intentionally public Mux playback IDs.
2. A paid episode must have no playback ID or durable Mux URL in HTML, React
   Server Component payloads, native props, SEO/JSON-LD, sitemaps, share pages,
   warmers, prefetchers, logs, analytics, or client persistence.
3. Paid playback is obtained only from
   `GET /api/playback/<series-slug>--<episode-number>` after current VIP or
   series-entitlement authorization.
4. Mux signing keys and the public-to-signed ID map are server-only. They must
   never enter a `NEXT_PUBLIC_*` variable, browser bundle, Expo bundle, EAS
   archive, log, analytics payload, crash report, or repository fixture.
5. Signed mode fails closed. Once `MUX_SIGNED_PLAYBACK_ENABLED=true`, a missing
   map row, missing signing key, invalid flag, or signing failure returns 503;
   it never falls back to a public paid URL.
6. Signed URLs are bearer capabilities. Responses are `private, no-store`,
   in-memory caches are account-scoped and expiry-aware, and no URL is logged.
7. Free and paid classification comes from each live catalog series'
   `freeEpisodes`; there is no global hard-coded episode count.
8. `lib/mux-map.ts` is the complete legacy-capability audit/data-sync anchor.
   Web and native runtime import only their byte-identical
   `mux-public-map.ts` projections. Do not replace complete-map rows with
   signed IDs, import the complete/private maps from a client module, or copy
   `lib/mux-signed-map.ts` into native.

## Verified inventory snapshot — 2026-08-03

The corrected shared AST catalog parser, public-projection generator, and final
live Mux readback produced this reconciled snapshot. The add-only migration had
already finished when the final audit ran; it did not remove or alter any
legacy public ID:

| Check | Result |
| --- | ---: |
| Mux assets scanned | 5,220 |
| All mapped episode rows | 4,262 |
| Mapped rows belonging to 79 live titles | 4,212 |
| Intentionally public/free live rows | 459 |
| Paid-live rows | 3,753 |
| Coming-soon rows | 50 |
| Total capabilities withheld from client projections | 3,803 |
| Paid-live rows with a server-only signed counterpart | 3,753 |
| Mapped IDs absent from Mux | 0 |
| Duplicate mapped playback IDs | 0 |
| IDs reused by both free and paid rows | 0 |
| Paid-live rows still needing a signed counterpart | 0 |
| Mux-map series outside the catalog | 0 |

An earlier regex parser skipped catalog entries when comments appeared before
their `slug`, incorrectly treating `exes-premiere` and `love-awards` as
out-of-catalog and withholding 25 wholly free Red Carpet IDs. The shared AST
parser fixed that classification. Never reintroduce a regex-only catalog parse;
the generator self-test freezes comments-before-slug behavior.

These numbers are a dated observation, not a permanent constant. Re-run the
read-only audit immediately before any migration or release decision.

## Data model

### Complete audit/data-sync anchor

`lib/mux-map.ts` maps a logical series/episode to the existing public playback
ID and duration:

```ts
type MuxEpisode = {
  episode: number;
  playbackId: string; // legacy/public anchor; direct use is free-only
  duration: number;
};
```

The native audit mirror is `../verza-native/src/lib/mux-map.ts`. The files stay
byte-identical for catalog reconciliation, but the native EAS archive excludes
the complete map and neither web nor native runtime imports it directly.

### Client-safe public projection

`lib/mux-public-map.ts` is generated from the complete anchor and catalog
classification. It preserves episode number and duration for all 4,262 rows,
but includes `playbackId` only for the 459 intentionally public/free live rows.
It withholds all 3,753 paid-live IDs and all 50 coming-soon IDs. Its native
mirror is byte-identical.

`lib/mux-private-map.ts` imports `server-only` and is the backend's only gateway
to the complete map. Browser/client modules must never import that gateway or
the complete anchor.

### Server-only signed map

`lib/mux-signed-map.ts` is generated from verified live Mux inventory. It maps
the old public anchor to a signed playback ID on the same asset:

```ts
legacyPublicPlaybackId -> signedPlaybackIdOnTheSameMuxAsset
```

The file imports `server-only` and is now generated for all 3,753 paid-live
rows. Generation refuses partial or ambiguous coverage and writes atomically.
Never hand-edit it.

### Server delivery module

`lib/mux-playback.ts` is the only signing implementation. It:

- parses `MUX_SIGNED_PLAYBACK_ENABLED` as exact `true` or `false`;
- defaults the flag to `false` for a safe compatibility deployment;
- returns ordinary public URLs for catalog-free episodes;
- returns an authorized legacy-public paid URL only while the signed-playback
  feature flag is exactly `false`;
- in signed mode requires a generated map row and signing credentials;
- signs video and thumbnail JWTs independently;
- places signed-thumbnail transformations inside the thumbnail JWT claims;
- uses a 30-minute expiry and returns its UNIX `expiresAt`; and
- includes no user ID, email, entitlement, purchase, or other PII in a token.

The maximum mapped episode duration at the 2026-08-03 audit was 399 seconds,
so a newly issued 30-minute token has ample playback runway. Clients stop
reusing a token 90 seconds before expiry. A player already using a URL is not
interrupted; if an expired/backgrounded source fails, the client uses bounded
refresh (at most two media-triggered attempts per mounted slide) and restores
its playhead on the same player.

## Playback endpoint contract

Route: `GET /api/playback/<slug>--<episode>`

Implementation: `app/api/playback/[episode]/route.ts`

The route parses on the final `--`, validates the slug and positive safe
integer, requires a live catalog series and in-range episode, and resolves the
Mux row. Every response has:

```http
Cache-Control: private, no-store, max-age=0
Pragma: no-cache
Vary: Authorization, Cookie
```

### Catalog-free response

No authentication is required. The ID is intentionally public:

```json
{
  "status": "ok",
  "series": "example-series",
  "episode": 1,
  "playbackId": "PUBLIC_ID",
  "playbackUrl": "https://stream.mux.com/PUBLIC_ID.m3u8",
  "duration": 90,
  "poster": "https://image.mux.com/PUBLIC_ID/thumbnail.jpg?...",
  "policy": "public",
  "expiresAt": null
}
```

### Authorized paid response in signed mode

The route accepts the web Supabase cookie session or native Supabase Bearer
token. It grants access only for current VIP status or an entitlement row. A
paid response deliberately omits `playbackId`:

```json
{
  "status": "ok",
  "series": "example-series",
  "episode": 6,
  "playbackUrl": "https://stream.mux.com/SIGNED_ID.m3u8?token=JWT",
  "duration": 90,
  "poster": "https://image.mux.com/SIGNED_ID/thumbnail.jpg?token=JWT",
  "policy": "signed",
  "expiresAt": 1785792600
}
```

Expected failures:

| Status | Meaning |
| --- | --- |
| 400 | Malformed slug/episode key |
| 402 | Paid episode without current VIP/series entitlement |
| 404 | Unknown, non-live, out-of-range, or unmapped episode |
| 503 | Signed mode is configured incompletely or Mux signing failed |

The 503 body is generic. Logs contain only a non-secret operational marker,
never an ID, URL, JWT, key, or request authorization value.

## Client behavior

### Web

- `app/series/[slug]/[episode]/page.tsx` puts public IDs into `FeedEpisode`
  only for catalog-free episodes. Paid RSC payloads contain no Mux ID.
- `lib/playback-client.ts` calls the endpoint for paid active/near slides,
  deduplicates requests, scopes cache entries to the current Supabase user ID,
  and refuses to reuse a signed URL inside the 90-second expiry skew.
- `components/EpisodeFeed.tsx` retains the existing active ±1 loading window.
  On a signed-network failure it saves the playhead, invalidates the logical
  source, obtains fresh authorization, reuses the same video element, and
  restores the playhead. Recovery is bounded.
- `components/BrowsePage.tsx` and `lib/instant-player.ts` warm only catalog-free
  episodes. A paid resume never enters the instant-player path.
- Clip pages, episode JSON-LD, content-source SEO data, and episode sitemaps use
  durable Mux video/image URLs only for free episodes; paid metadata uses
  series art.
- Shorts use only episode 1 of a series whose catalog says episode 1 is free.
- The legacy `Player`, `HeroVideo`, and `RedCarpetHero` surfaces are
  public-preview-only. The legacy `Player` fails closed when the episode is
  outside `freeEpisodes`.

### Native

- `src/app/series/[slug]/[episode].tsx` omits paid IDs and marks those episodes
  `requiresAuthorization`.
- `src/lib/authorized-playback.ts` calls the same endpoint with the Supabase
  Bearer token, scopes memory cache entries to the current user ID, and applies
  the same expiry skew.
- `src/components/EpisodeFeed.tsx` fetches a paid URL only after the existing
  access check says the slide is playable. Refresh reuses the exact expo-video
  player with `replaceAsync(null/newUrl)`, preserving the hard limit of at most
  three attached players and restoring the playhead.
- `src/lib/warm-player.ts`, `src/lib/prefetch.ts`, `ShortsFeed`, the legacy
  `Player`, and clip thumbnails all have explicit catalog-free gates.
- Native creator PPV is fail-closed. The free creator query includes
  `pricing_type = free` in the database request that selects a playback ID.
  Signed creator playback plus a column-safe server metadata endpoint are
  post-launch prerequisites before creator PPV can be enabled.

Neither client persists signed URLs to local storage, secure storage,
Supabase, files, navigation parameters, or analytics.

## Environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `MUX_TOKEN_ID` | Server/ops only | Read inventory and add signed IDs during migration |
| `MUX_TOKEN_SECRET` | Secret, server/ops only | Mux Video API authentication |
| `MUX_SIGNING_KEY_ID` | Server only | JWT `kid`/signing configuration |
| `MUX_SIGNING_KEY_SECRET` | Secret, server only | Base64-encoded private signing key |
| `MUX_SIGNED_PLAYBACK_ENABLED` | Server only | Exact boolean feature flag; defaults false |

Signing-key creation is a separate, deliberate Mux Dashboard/API operation.
The migration script does not create, rotate, or remove signing keys. The Mux
API token needs the permissions required to read Video assets and add playback
IDs; signing operations require the appropriate System permissions described
by Mux. Store production values as sensitive Vercel variables.

## Safe migration tool

Script: `scripts/migrate-mux-signed-playback.mjs`

Safety properties:

- default mode is a live read-only audit;
- offline parser/generator self-test is available;
- adding IDs requires two explicit confirmation flags;
- the only write adds `{ policy: "signed" }` to the existing asset;
- existing public IDs are untouched;
- ambiguous write responses are verified by re-reading the asset before the
  script proceeds;
- progress is atomically checkpointed under ignored `scripts/out/`;
- the Mux POST rate is held to about one request/second;
- a complete inventory is re-read after writes; and
- map generation refuses partial coverage and writes atomically.

Commands:

```bash
# Offline and non-mutating
npm run mux:signed:self-test

# Live inventory, non-mutating
npm run mux:signed:audit

# Guarded live mutation for a future audit-confirmed delta only. The 2026-08-03
# paid-live inventory is already complete; do not run this as routine release work.
node --env-file=.env.local scripts/migrate-mux-signed-playback.mjs \
  --apply-add-signed-ids --confirm-add-signed-ids

# After coverage is complete, regenerate the server-only map from live state.
node --env-file=.env.local scripts/migrate-mux-signed-playback.mjs \
  --generate-map
```

The apply command is resumable: signed IDs already visible on an asset are
reused, not duplicated. Never run it with an unreviewed Mux environment or
credentials. No command in this script retires a public ID.

## Production release sequence

### Phase 1 — compatibility deployment, signed flag false — COMPLETE

1. Run typecheck, lint/contract scans, builds, and the read-only Mux audit.
2. Deploy the endpoint, complete signed map, client-safe public projection, and
   new web/native clients with
   `MUX_SIGNED_PLAYBACK_ENABLED=false`.
3. Verify the generated signed map still covers exactly all 3,753 paid-live
   rows and the client projection withholds exactly 3,803 capabilities.
4. Verify free playback, signed-out paywall, entitled series unlock, VIP, deep
   links, background/foreground, and the native player-pool invariant.
5. Confirm paid/coming-soon IDs are absent from rendered HTML, RSC payloads,
   browser bundles, Expo/Hermes bundles, EAS archives, logs, analytics, and SEO.

Compatibility mode still returns an authorized public paid URL, so it is a
deployment bridge, not the completed security cutover.

### Phase 2 — production key/configuration while public IDs coexist — COMPLETE

The add-only signed-ID inventory migration completed on 2026-08-03: every
paid-live asset has a signed counterpart and every legacy public ID remains.
Do not rerun writes merely because this phase remains open. Instead:

1. Create/retrieve the production Mux signing key through approved operations;
   do not paste it into source or chat.
2. Run the offline self-test and a fresh read-only audit.
3. If and only if the fresh audit finds a newly added paid asset without a
   signed ID, use the dual-confirmation add-only operation and re-audit.
4. Generate `lib/mux-signed-map.ts`; review that it contains IDs only and no
   credential or JWT.
5. Configure the production signing ID/private key as sensitive Vercel env.
6. Deploy the complete map and credentials while the feature flag remains
   false. Verify the deployment is healthy.

### Phase 3 — signed-mode backend canary COMPLETE; standalone native acceptance OPEN

1. **Complete:** set `MUX_SIGNED_PLAYBACK_ENABLED=true` in production and
   redeploy/restart so the server reads the new value.
2. **Backend canary complete; broader client matrix open:** verify the full
   access matrix, response headers, 30-minute expiry, expiry
   refresh with playhead preservation, sign-out/account switch, and 503
   fail-closed behavior with a controlled missing-map/key test outside live.
3. Test at least one first-paid, middle, and last episode across multiple
   series on web, iPhone, and iPad; test VIP and per-series entitlement paths.
4. **Production route verified:** a paid entitled 200 has `policy=signed`,
   `expiresAt`, 1,800-second tokenized stream/poster URLs, no separate
   `playbackId`, and a 200 manifest.
5. Confirm free discovery, Shorts, share art, and search metadata still work.

Because the old public IDs still coexist, rollback during this phase is the
exact flag flip to `false` followed by redeploy/restart.

## Creator Mux webhook boundary

Creator upload events are separate from catalog signed playback. The deployed
`/api/mux/webhook` route fails closed:

- absent/blank `MUX_WEBHOOK_SECRET` returns 503;
- raw-body Mux SDK verification is awaited;
- missing/invalid signature or body returns 400;
- there is no unsigned JSON fallback;
- every Supabase lookup/update error returns 500 so Mux retries; and
- only an unknown **verified** event is acknowledged without mutation.

`npm run test:mux-webhook-security` freezes those rules and exercises synthetic
valid/invalid signatures without provider/database mutation. Production
readback with the intentionally absent `MUX_WEBHOOK_SECRET` returns 503
`Webhook verification unavailable`. Creator ingestion and creator PPV remain
deferred until a real secret is configured and a signed provider-event canary
passes. Do not confuse the webhook secret with the playback signing private
key.

### Phase 4 — manual public-ID retirement gate

The live native 1.2 binary still streams legacy paid public IDs directly. Its
users would lose playback immediately if those IDs were retired. Therefore
retirement is **not** part of the 2.0 submission cutover. Only after 2.0 is
released, adoption is measured, and the owner explicitly approves a forced
update/drain policy may a separately reviewed operation retire exactly the
3,753 paid public playback IDs while leaving all 459 intentionally public IDs
intact. Before that operation, archive the verified
public-ID/asset/signed-ID correspondence and record deployment, release,
adoption, audit, outage-risk acceptance, and approver evidence.

This repository intentionally contains no bulk public-ID retirement command.
Retirement is irreversible: Mux cannot recreate the same old public ID, and old
clients that stream it directly cannot be repaired by a server flag. Never
retire paid public IDs before or merely to support App Store submission.

After retirement, setting the flag false is not a usable rollback. Recovery is
forward-fix signed delivery, or creation of new public IDs plus catalog/client
updates; the original IDs cannot simply be restored.

## Required verification

```bash
# Web
npm run mux:signed:self-test
npm run test:playback-security
npx tsc --noEmit
npm run build

# Native (do not use Expo Go as a release test)
cd ../verza-native
npm run test:playback-security
npm run typecheck
npm run lint
npx expo export --platform ios
```

Also perform real-device/TestFlight playback and purchase/access tests. A
successful build does not exercise Mux authorization, Apple receipt/account
state, background expiry, or device decoder limits.

## Incident response

- **Paid route returns 503:** leave signed mode on if only a narrow row is
  affected and fix the map/key forward; if public IDs still exist, flag-off is
  the fast rollback. Never add an automatic public fallback in signed mode.
- **Paid route returns 402 for a purchaser:** verify authenticated account,
  VIP status, canonical entitlement, refund/dispute state, and webhook/claim
  reconciliation. Do not bypass the authorization route with an ID.
- **Token expires after backgrounding:** the client should use its bounded
  refresh on the same player and restore playhead. Capture only status/error class; never
  capture the URL.
- **Black video/network poisoning on native:** audit the ≤3 attached-player
  invariant first. Token refresh must source-swap an existing player, not
  allocate a fourth.
- **Token or key appears in logs:** treat it as credential/capability exposure,
  stop logging, rotate the signing key if a private key was exposed, invalidate
  relevant deployments/caches, and document the incident.
- **Generated-map drift:** keep signed mode fail-closed, run a fresh read-only
  inventory audit, add missing signed IDs through the guarded script, regenerate
  the whole map, and redeploy. Never hand-patch a single row in production.

## Mux references

- [Secure video playback](https://www.mux.com/docs/guides/secure-video-playback)
- [Signing JWTs](https://www.mux.com/docs/guides/signing-jwts)
- [Images and signed thumbnail parameters](https://www.mux.com/docs/guides/get-images-from-a-video)
- [Mux API authentication and rate limits](https://www.mux.com/docs/core/make-api-requests)
