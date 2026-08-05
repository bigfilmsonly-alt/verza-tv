# Apple StoreKit series unlocks

Last reconciled with the frozen backend source and App Store Connect readback:
**2026-08-05**. This is the operational authority for the web/backend half of
the iOS StoreKit launch. Native purchase UI, StoreKit transaction finishing,
signed-binary inspection, screenshots, and App Store submission remain owned by
`../../verza-native`.

## Release truth

Apple non-consumable full-series unlock support is now live at backend commit
`a9b537844a8878851ecfe4c0e310f405b68fc6ef`:

- the 74 immutable non-consumable product IDs exist in App Store Connect;
- each has current `en-US` metadata, a US base price of $1.99 with Apple's
  storefront equalization, the reviewed 173-territory availability set, and
  title-specific review notes;
- Family Sharing and Apple-hosted content are off for all 74;
- all 74 still report `MISSING_METADATA` because the required review screenshot
  has not been attached to each product;
- migration `015_apple_iap_series_unlocks.sql` is applied; structural, RLS,
  RPC, privilege, and independent-source preservation readbacks passed;
- the canonical Vercel deployment is live; authenticated no-charge preflight
  returned 200 with the exact product and private/no-store, unauthenticated
  preflight returned 401, malformed notification returned 400, and Terms,
  Privacy, Refund, and Help returned 200 with Apple wording;
- `APPLE_IAP_ENABLED` is exact true and the Sandbox allowlist is narrowly set;
  both variable names remain Production `Sensitive` and no raw value was
  printed;
- App Store Server Notifications V2 production and sandbox URLs are configured
  to the exact canonical route with sibling settings unchanged, but no real
  Apple-signed test notification has been delivered yet; and
- the Paid Applications agreement (banking/tax), App Store `Video` tax-category
  readback, DSA trader declaration, IAP screenshots, exact TestFlight purchase/
  restore matrix, and final App Review attachment remain release gates.

Do not call the signed notification or purchase path proven merely because the
backend is live. Do not call a product review-ready merely because its App Store
Connect record exists.

## Product and price contract

Each of the 74 current paid-live series is one Apple
`NON_CONSUMABLE`. A successful purchase grants that entire series to the
verified VERZA account. There are no coins, per-episode Apple products,
subscriptions, Family Sharing grants, or hosted-content downloads in this
release.

The native app must display the localized `Product.displayPrice` returned by
StoreKit. `$1.99` is the configured US base price, not a promise that every
storefront displays USD 1.99. Apple calculates storefront prices and handles
App Store billing; Stripe remains the separate web/eligible-Android processor.
Apple's App Store tax category must be saved and read back as `Video`; this is
not the Stripe automatic-tax flag or proof of a tax registration.

`lib/apple-iap-product-manifest.ts` is the append-only product registry. Its
current 74 ordered `(series slug, product ID)` pairs have SHA-256
`ce6f3bc86b2120f37178641d5da31b866e1a94781bd460e7ddaeeddd07c5edfd` when
encoded as compact JSON in source order. Product IDs cannot be edited or
reused after creation. To retire a title, retain its registry row and add its
slug to `APPLE_RETIRED_SERIES_PRODUCT_SLUGS`; restoration, refund, revocation,
and notification verification must continue to recognize it.

The exact current mapping is:

| # | Series slug | Immutable Apple product ID |
| ---: | --- | --- |
| 1 | `the-mistress-trap` | `com.verzatv.app.series.the_mistress_trap` |
| 2 | `do-not-deceive-me` | `com.verzatv.app.series.do_not_deceive_me` |
| 3 | `collateral-hearts` | `com.verzatv.app.series.collateral_hearts` |
| 4 | `the-billionaires-betrayal` | `com.verzatv.app.series.the_billionaires_betrayal` |
| 5 | `undercovered-heart` | `com.verzatv.app.series.undercovered_heart` |
| 6 | `under-her-control` | `com.verzatv.app.series.under_her_control` |
| 7 | `two-worlds-apart` | `com.verzatv.app.series.two_worlds_apart` |
| 8 | `the-blackthornes` | `com.verzatv.app.series.the_blackthornes` |
| 9 | `marry-the-wrong-bride` | `com.verzatv.app.series.marry_the_wrong_bride` |
| 10 | `destined-to-be` | `com.verzatv.app.series.destined_to_be` |
| 11 | `the-day-we-got-married` | `com.verzatv.app.series.the_day_we_got_married` |
| 12 | `the-winter-veil` | `com.verzatv.app.series.the_winter_veil` |
| 13 | `the-marriage-contract` | `com.verzatv.app.series.the_marriage_contract` |
| 14 | `the-haunted-sisters` | `com.verzatv.app.series.the_haunted_sisters` |
| 15 | `the-missing-piece` | `com.verzatv.app.series.the_missing_piece` |
| 16 | `mysterious-murder` | `com.verzatv.app.series.mysterious_murder` |
| 17 | `married-to-a-stranger` | `com.verzatv.app.series.married_to_a_stranger` |
| 18 | `blood-contract` | `com.verzatv.app.series.blood_contract` |
| 19 | `cleopatra` | `com.verzatv.app.series.cleopatra` |
| 20 | `im-obsessed-with-my-boss` | `com.verzatv.app.series.im_obsessed_with_my_boss` |
| 21 | `duty-of-desire` | `com.verzatv.app.series.duty_of_desire` |
| 22 | `echo-of-vengeance` | `com.verzatv.app.series.echo_of_vengeance` |
| 23 | `faded-threads` | `com.verzatv.app.series.faded_threads` |
| 24 | `hidden-agenda` | `com.verzatv.app.series.hidden_agenda` |
| 25 | `hollywood-stars-fake-girlfriend` | `com.verzatv.app.series.hollywood_stars_fake_girlfriend` |
| 26 | `i-think-my-wife-wants-to-kill-me` | `com.verzatv.app.series.i_think_my_wife_wants_to_kill_me` |
| 27 | `in-love-with-my-godfathers-daughter` | `com.verzatv.app.series.in_love_with_my_godfathers_daughter` |
| 28 | `love-lies-and-bloodline` | `com.verzatv.app.series.love_lies_and_bloodline` |
| 29 | `loves-perfect-crime` | `com.verzatv.app.series.loves_perfect_crime` |
| 30 | `mafia-lords-secret-love` | `com.verzatv.app.series.mafia_lords_secret_love` |
| 31 | `my-celebrity-boyfriend-killed-me` | `com.verzatv.app.series.my_celebrity_boyfriend_killed_me` |
| 32 | `my-handsome-bodyguard` | `com.verzatv.app.series.my_handsome_bodyguard` |
| 33 | `never-mess-with-a-badass-girl` | `com.verzatv.app.series.never_mess_with_a_badass_girl` |
| 34 | `sisters-have-crush-on-the-same-man` | `com.verzatv.app.series.sisters_have_crush_on_the_same_man` |
| 35 | `the-billionaires-vow` | `com.verzatv.app.series.the_billionaires_vow` |
| 36 | `lost-and-found` | `com.verzatv.app.series.lost_and_found` |
| 37 | `help-im-falling-in-love-with-my-rude-ceo` | `com.verzatv.app.series.help_im_falling_in_love_with_my_rude_ceo` |
| 38 | `an-affair-with-my-boss` | `com.verzatv.app.series.an_affair_with_my_boss` |
| 39 | `a-love-once-betrayed` | `com.verzatv.app.series.a_love_once_betrayed` |
| 40 | `in-her-shadow` | `com.verzatv.app.series.in_her_shadow` |
| 41 | `good-for-him` | `com.verzatv.app.series.good_for_him` |
| 42 | `one-night-stand` | `com.verzatv.app.series.one_night_stand` |
| 43 | `if-only-you-were-mine` | `com.verzatv.app.series.if_only_you_were_mine` |
| 44 | `one-night-one-forever` | `com.verzatv.app.series.one_night_one_forever` |
| 45 | `runaway-bride` | `com.verzatv.app.series.runaway_bride` |
| 46 | `the-billionaires-lost-love` | `com.verzatv.app.series.the_billionaires_lost_love` |
| 47 | `camouflage` | `com.verzatv.app.series.camouflage` |
| 48 | `killer-romance` | `com.verzatv.app.series.killer_romance` |
| 49 | `honey-gold` | `com.verzatv.app.series.honey_gold` |
| 50 | `revenge-on-my-cheating-fiance` | `com.verzatv.app.series.revenge_on_my_cheating_fiance` |
| 51 | `the-escort` | `com.verzatv.app.series.the_escort` |
| 52 | `school-hall` | `com.verzatv.app.series.school_hall` |
| 53 | `conflicted-hearts` | `com.verzatv.app.series.conflicted_hearts` |
| 54 | `my-sister-stole-my-man` | `com.verzatv.app.series.my_sister_stole_my_man` |
| 55 | `the-phoenix-conspiracy` | `com.verzatv.app.series.the_phoenix_conspiracy` |
| 56 | `the-chauffeur` | `com.verzatv.app.series.the_chauffeur` |
| 57 | `twisted-fates` | `com.verzatv.app.series.twisted_fates` |
| 58 | `the-dumb-billionaire-heiress-pt-2` | `com.verzatv.app.series.the_dumb_billionaire_heiress_pt_2` |
| 59 | `tied-by-fate` | `com.verzatv.app.series.tied_by_fate` |
| 60 | `the-crown` | `com.verzatv.app.series.the_crown` |
| 61 | `rosy-psycho` | `com.verzatv.app.series.rosy_psycho` |
| 62 | `the-unforgettable-love` | `com.verzatv.app.series.the_unforgettable_love` |
| 63 | `why-i-did-it` | `com.verzatv.app.series.why_i_did_it` |
| 64 | `the-ceo` | `com.verzatv.app.series.the_ceo` |
| 65 | `twist-of-time` | `com.verzatv.app.series.twist_of_time` |
| 66 | `she-is-mine` | `com.verzatv.app.series.she_is_mine` |
| 67 | `the-pendleton-secret` | `com.verzatv.app.series.the_pendleton_secret` |
| 68 | `the-perfect-husband` | `com.verzatv.app.series.the_perfect_husband` |
| 69 | `the-inheritance-game` | `com.verzatv.app.series.the_inheritance_game` |
| 70 | `billionaire-daughters-love-triangle` | `com.verzatv.app.series.billionaire_daughters_love_triangle` |
| 71 | `married-to-my-brothers-ex` | `com.verzatv.app.series.married_to_my_brothers_ex` |
| 72 | `tangled-in-desire` | `com.verzatv.app.series.tangled_in_desire` |
| 73 | `the-escaping-mistress` | `com.verzatv.app.series.the_escaping_mistress` |
| 74 | `trial-marriage-to-a-billionaire-s2` | `com.verzatv.app.series.trial_marriage_to_a_billionaire_s2` |

The underscore suffix is intentional. App Store Connect rejected the earlier
hyphenated proposal before any such product was created. The native and backend
manifests must stay byte-for-byte equivalent in mapping, even though their
module wrappers differ.

## Trust and API architecture

The backend uses `@apple/app-store-server-library` 3.1.0 and Apple's bundled
public trust anchors. It needs no App Store Server API private key to verify a
StoreKit-signed transaction or V2 notification. Verification is server-only and
pins the production bundle ID and numeric App Store app ID; sandbox is accepted
only through the separately configured review-user allowlist.

For every transaction, the server verifies and normalizes:

- Apple's JWS certificate chain and signature;
- Production or Sandbox environment;
- canonical bundle/app identity;
- numeric transaction and original-transaction identifiers;
- append-only product ID to exact series mapping;
- `NON_CONSUMABLE`, quantity one, purchased ownership, and purchase reason;
- UUID `appAccountToken` binding;
- purchase/signed/revocation timestamps; and
- price/currency pairing when Apple includes those fields.

The database retains hashes of the signed transaction and purchase-time account
token, not the raw JWS or account token. Root certificates are public trust
material, not credentials.

### `POST /api/iap/apple/preflight`

Requires an exact Supabase Bearer session and `{ "seriesSlug": "..." }`.
Before returning a product ID it rechecks that the account is live, not being
deleted, is not current VIP, has no entitlement for the series, the catalog
offer is paid/live, the product is registered and not retired, and
`APPLE_IAP_ENABLED` is exact `true`. The success payload is
`purchaseAllowed`, exact `productId`, and exact `seriesSlug`; it never returns a
price or grants access.

### `POST /api/iap/apple/transactions`

Requires an exact Supabase Bearer session plus `signedTransaction`,
`expectedSeriesSlug`, and optional `restoreMode`. This route deliberately
continues verifying already-created StoreKit transactions when new-purchase
preflight is disabled; otherwise a rollback could strand or repeatedly
redeliver a legitimate purchase.

For a new purchase, the signed `appAccountToken` must equal the current lower-
cased Supabase user UUID. A restore cannot move a purchase from a live VERZA
account. It may rebind only a purchase already present in the canonical ledger
with `user_id IS NULL`, only when `restoreMode=true`, and only after both the old
profile and old Supabase Auth user are proven absent.

The response separates durable verification from access:

- `verified=true` and `finishAuthorized=true` mean the signed canonical
  transaction is durably recorded and the native client may finish it;
- `accessGranted=true` means the canonical purchase is active and the account
  currently has a materialized entitlement; and
- `canonicalStatus`, `accountRebound`, transaction ID, series, and environment
  are diagnostic state, not client authority.

A verified refund/revocation transaction can therefore be finish-authorized
while `accessGranted=false`. Native must never equate `verified` or
`finishAuthorized` with playback access.

### `POST /api/iap/apple/notifications`

This public provider route accepts only `{ "signedPayload": "..." }`, verifies
Apple's outer V2 notification JWS and any inner transaction JWS, and uses the
canonical production URL:

`https://www.verzatv.com/api/iap/apple/notifications`

`ONE_TIME_CHARGE`, `REFUND`, `REVOKE`, and `REFUND_REVERSED` reconcile access.
Other valid notification types are idempotently recorded and acknowledged
without inventing a transaction mutation. A notification UUID is claimed once;
concurrent delivery is retryable, processed delivery is acknowledged, and a
failed/stale claim can be retried. The later of the outer and inner Apple-signed
timestamps is the provider event clock. Equal-clock adverse state outranks
active state, while a genuinely later `REFUND_REVERSED` may restore it.

The notification route is not gated by `APPLE_IAP_ENABLED`. Refunds and
revocations must continue to reconcile when new sales are disabled. Sandbox
transactions are accepted only when their signed account token is allowlisted.

## Migration 015 and multi-provider access

Migration `015_apple_iap_series_unlocks.sql` adds:

- append/update-only, service-role-only `apple_iap_purchases` keyed by
  `original_transaction_id`;
- append/update-only, service-role-only `apple_iap_notifications` keyed by
  notification UUID;
- `entitlements.apple_original_transaction_id` and non-null
  `entitlements.manual_grant`;
- a monotonic, row-locked `record_apple_series_transaction` RPC;
- retry-safe notification claim/finish RPCs; and
- a trigger that prevents a Stripe-specific entitlement delete from erasing an
  independent Apple or manual source.

One `(user_id, series_slug)` entitlement row can carry three independent source
classes at once: Stripe `purchase_id`, Apple `apple_original_transaction_id`,
and `manual_grant=true`. The migration classifies pre-existing entitlements
without a Stripe purchase as manual grants. Provider-specific adverse events
clear only their own source:

- an Apple refund/revocation does not remove Stripe or manual access;
- a Stripe full refund/dispute does not remove Apple or manual access;
- revoking one Apple original falls back to another active verified Apple
  original for that account/title; and
- the entitlement row is removed only when no valid source remains.

The provider clock is `signed_date`. A later event wins; at an equal timestamp
`refunded` outranks `revoked`, which outranks `active`. This prevents an old or
equal-clock device replay from resurrecting access after an adverse event.

Account deletion does not issue an Apple refund. The profile/Auth cascade
removes account-owned entitlements and changes the retained Apple ledger owner
to `NULL`; the purchase-time token remains only as a hash. If deletion fails,
the live binding and independent access sources remain recoverable after the
temporary deletion guard is cleared. The account route must never directly
purge `entitlements` before the profile/Auth deletion succeeds.

## Environment contract

| Variable | Exact semantics | Exposure |
| --- | --- | --- |
| `APPLE_IAP_ENABLED` | Only exact `true` opens new-purchase preflight. Missing, `false`, or any other value closes preflight. It does not disable transaction verification or notifications. | Server-only release flag; store as Sensitive in production |
| `APPLE_IAP_SANDBOX_ALLOWED_USER_IDS` | Comma-separated Supabase user UUIDs whose signed `appAccountToken` may create Sandbox/TestFlight ledger state. Empty denies all Sandbox transaction fulfillment. Production transactions do not use this allowlist. | Server-only personal identifier set; Sensitive |

Do not put sandbox/reviewer UUIDs, access tokens, Apple login details, one-time
codes, signed JWS payloads, or provider credentials in Git, Markdown, tickets,
screenshots, or command output. No Apple private key/issuer/key-ID variables are
required for this verification-only architecture.

## Safe deployment and readback

The current release completed steps 1–6 and the configuration portion of step
7 at commit `a9b537844a8878851ecfe4c0e310f405b68fc6ef`. Keep this full
sequence for any fresh environment or replacement deployment. Commands show
names and structure, never secret values.

1. Prove source and rollback-only database behavior:

   ```bash
   git status --short
   git diff --check
   npm ci
   npm run test:playback-security
   npm run test:mux-webhook-security
   npm run test:payments
   npm run test:payments:db
   npx tsc --noEmit
   npm run lint
   npm run build
   npm audit --omit=dev
   ```

2. Link Supabase through the approved operator profile without copying a
   password or project credential into the command/transcript. Read back the
   migration history, then dry-run. Stop unless `015` is the only pending
   migration:

   ```bash
   npx supabase@2.67.1 migration list --linked
   npx supabase@2.67.1 db push --linked --dry-run
   ```

3. Apply exactly migration 015 and immediately read back history. If any
   unexpected migration appears, stop rather than using `--include-all`:

   ```bash
   npx supabase@2.67.1 db push --linked
   npx supabase@2.67.1 migration list --linked
   npm run test:payments:db
   ```

4. In the approved Vercel secret UI, verify both Apple variable names target
   Production and are `Sensitive`. A fresh rollout starts with new-purchase
   preflight false and the smallest required Sandbox UUID allowlist. Never
   print either value. The current deployment has exact true preflight for
   controlled TestFlight testing and a narrow allowlist.
   The names/type-only CLI readback is:

   ```bash
   npx vercel env ls production --format json
   ```

   Inspect only `key`, `type`, and `target`; do not export or pull values.

5. Deploy the frozen commit and record the immutable deployment URL before
   checking the canonical alias:

   ```bash
   npx vercel --prod --yes
   ```

6. Verify canonical legal pages and negative route behavior. These calls
   contain no credential:

   ```bash
   curl --fail-with-body --silent --show-error https://www.verzatv.com/terms >/dev/null
   curl --fail-with-body --silent --show-error https://www.verzatv.com/privacy >/dev/null
   curl --fail-with-body --silent --show-error https://www.verzatv.com/refund-policy >/dev/null
   curl --fail-with-body --silent --show-error https://www.verzatv.com/help >/dev/null
   curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
     -X POST https://www.verzatv.com/api/iap/apple/preflight \
     -H 'content-type: application/json' \
     --data '{"seriesSlug":"the-mistress-trap"}'
   curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
     -X POST https://www.verzatv.com/api/iap/apple/notifications \
     -H 'content-type: application/json' \
     --data '{}'
   ```

   The unauthenticated preflight and malformed notification must both be 401/
   400-class failures respectively, with private/no-store response headers.

7. Configure both App Store Server Notifications V2 production and sandbox
   delivery to the canonical notification URL. URL/V2/sibling readback is now
   complete. Still open: use Apple's signed test-notification action and require
   HTTP 200 plus one `processed` notification UUID in the private ledger. Never
   use a hand-built or copied JWS as proof.

8. Exact true preflight and a controlled authenticated no-charge readback are
   complete: the response mapped the paid-live slug to the exact manifest
   product and was private/no-store. This enables the narrow Sandbox/TestFlight
   test phase, not public sale readiness. Keep the bearer token in the approved
   secret channel; do not place it in shell history, transcript, or Markdown.
   Paid Applications, App Store tax category, review screenshots, and native
   StoreKit product/transaction proof remain required before submission.

9. On the exact TestFlight build, perform the real Sandbox matrix:

   - buy one unowned series and verify one Apple original, one source-linked
     entitlement, paid playback, and no duplicate charge on repeated taps;
   - cancel a separate purchase and prove no entitlement/finish;
   - restore on the same VERZA account and prove idempotency;
   - try restore while the purchase belongs to another live VERZA account and
     prove denial;
   - delete an account, prove access disappears and the ledger is orphaned,
     then explicitly restore to a new account and prove only the orphaned
     original can rebind;
   - send Apple's signed test notification and prove idempotent 200 delivery;
   - exercise an official Sandbox refund/revocation path when available and
     prove only the Apple source is removed; and
   - verify Stripe/manual/alternate-Apple sources survive the corresponding
     provider-specific adverse event.

10. Keep the source/database/App Store/TestFlight evidence tied to exact commit,
    deployment, migration, native build, product-manifest hash, transaction IDs,
    and notification UUIDs without recording customer identity or JWS payloads.

## Stop and rollback rules

- If a future environment lacks migration 015/readback, keep preflight false
  and do not deploy code that depends on its RPCs. Production currently passed.
- If the backend deploy fails after migration 015, leave the additive schema in
  place and roll the Vercel alias back; do not edit/revert the applied migration.
- If purchase initiation is unsafe, set `APPLE_IAP_ENABLED=false` and redeploy.
  Continue processing signed transactions, refunds, revocations, restores, and
  notifications.
- If signed notifications fail, stop new sales until delivery and ledger
  reconciliation are healthy; do not acknowledge unverified payloads.
- Never delete an Apple ledger row, recycle a product ID, manually create an
  entitlement to conceal a failed purchase, or automatically refund a real
  customer merely to clean up a canary.

## Remaining owner/App Store gates

Backend deployment is complete, but these owner/provider actions remain:

- Paid Applications agreement banking and tax information must become active;
- DSA trader status must be declared and any verification completed;
- Pricing and Availability must show the app tax category `Video` after a full
  sibling-field readback;
- every first-version IAP needs its real review screenshot and must be included
  with the 2.0.0 app-version submission;
- Apple's signed V2 test notification must reach 200/processed and redeliver
  idempotently; URL configuration alone is not delivery proof;
- the exact StoreKit-enabled iPhone/iPad TestFlight build must pass purchase,
  cancel, pending/interrupted, restore, refund/revocation, account-switch,
  account-deletion, offline/retry, and paid-playback tests; and
- App Review submission occurs only after the owner approves that exact
  TestFlight build and a final API readback proves the version and all 74 IAP
  items are attached; and
- the separate credential incident requires Stripe secret/webhook, Supabase
  service-role, and paired Mux token rotations, Sensitive replacement deploy/
  canaries, and predecessor revocation without values entering logs/docs.

Passing source tests is necessary but does not satisfy any of these gates.
