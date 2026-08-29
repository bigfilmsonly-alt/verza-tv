# D2 — Localization. All 20 locales x all 115 keys = 2,300 i18n cells (the manifest denominator), plus the surrounding machinery that decides whether a cell ever reaches a viewer: key reachability from live code, the deployed bundle's copy of every cell, locale detection, RTL, currency/number/date formatting, plural handling, and the gate that is supposed to protect all of it.

**Coverage: 2300 of 2300 items examined.** 19 findings raised.

## Gaps — items in scope this agent could not examine

Five items in or adjacent to D2 scope that I could not settle here.

1. VISUAL LAYOUT / OVERFLOW at 320px in the 19 non-English locales — NOT EXAMINED. Localized copy expands up to +58% over English and the paywall's text box is ~256px (max-w-xs 320px minus px-8). Measured worst cases with real values substituted: paywall.cta sw 45 chars vs en 30 ("Fungua mfululizo — $1.99, malipo ya mara moja") on a text-base font-bold full-width button; paywall.unlockAll es/pt 30 chars vs en 19 on a text-2xl font-black heading; paywall.benefitAccess sw 76 chars vs en 63; paywall.previewOver de 133 chars vs en 109. All of these wrap rather than clip in principle (py-4, no fixed heights), but I did not render them. NEEDS: a browser at 320x568 stepping the locale through all 20 on /series/<paid-slug>/6 with the paywall open. I loaded the claude-in-chrome tools; driving them requires an interactive browser-selection prompt to the user that a workflow subagent cannot issue, so I stopped rather than guess.

2. ARABIC BIDI RENDERING of the price inside the CTA — NOT EXAMINED. formatMoney('ar', 199) emits "‏1.99 US$" with a leading RIGHT-TO-LEFT MARK, and it is interpolated into "فتح المسلسل — {price}، دفعة واحدة" inside the one div that does set dir="rtl". Whether the em dash, the RLM and the Latin "US$" resolve to a sane visual order is a rendering question, not a string question. NEEDS: the same browser pass, Arabic, screenshot of the paywall CTA.

3. NATIVE APP DICTIONARIES — OUT OF THIS REPO. ../verza-native is not present here. Whether the iOS/Android client shares lib/i18n.ts, carries its own copy, or is English-only is unverified, so the 2,300-cell denominator is web-only. NEEDS: the same D2 sweep run inside ../verza-native.

4. NATIVE-SPEAKER REVIEW of the 2,300 cells — NOT CERTIFIABLE BY ME. I ran mechanical checks (presence, emptiness, token identity, brace balance, English-identity, script coverage, mojibake, whitespace, apostrophe style, Spanish ¿/¡, French spacing, CJK punctuation, brand tokens) and close-read the 520 paywall/checkout/language cells, which is where D2-006, D2-007 and D2-015 came from. Register, idiom and mistranslation across 19 languages beyond what those checks surface is unaudited. NEEDS: a human reviewer per language, prioritised on the 52 rendered keys.

5. THE fil-vs-tl CLAIM (D2-008) is asserted from Chrome's and Safari's published language codes, not measured on a device. The code-side half is certain — resolveLocale(['fil-PH']) returns null, verified — but which tag a real Filipino handset sends is not. NEEDS: one device or one Accept-Language capture.

Two scope notes, not gaps. (a) Every one of the 2,300 cells was examined, and separately re-verified against production: I extracted the dictionary object out of the deployed chunk https://www.verzatv.com/_next/static/immutable/chunks/428d7hhx0m19l.js and diffed all 2,300 cells against lib/i18n.ts — 0 differences, so every finding above is confirmed shipped, per standing rule 4. (b) The brief's "confirm the paywall and every string added since Phase 1 are present" is answered YES and is the strongest thing in this dimension: commit 9b2fc27 added exactly 26 keys (13 paywall.*, 11 checkout.*, 2 language.*), all 520 cells are present, none is identical to English, and no interpolation token drifted — verified in source and in the deployed bundle. lib/i18n.ts has not changed since the manifest commit 83c29d1.

---

# D2 — Localization

**Repo** `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv` · **HEAD** `147d0f9` (manifest was cut at `83c29d1`; `lib/i18n.ts` is unchanged between them) · **Production** https://www.verzatv.com

## Coverage

| | |
|---|---|
| i18n cells in scope (115 keys x 20 locales) | **2,300** |
| Cells examined | **2,300 (100%)** |
| Cells re-verified against the deployed bundle | **2,300 (100%), 0 differences** |
| Findings | **19** (0 S1 · 3 S2 · 7 S3 · 9 S4) |

Every cell was checked for: presence, empty/non-string value, interpolation-token identity against `en`, brace balance and malformed tokens, byte-identity with `en`, own-script coverage (7 non-Latin locales), mojibake and U+FFFD, leading/trailing/double whitespace, apostrophe style, and brand-token survival. On top of that: reachability of all 115 keys from live code, rendered output for all 6 token-bearing keys x 20 locales, currency and grouping output for 20 locales, locale detection across 42 realistic BCP-47 tags, and a negative-controlled probe of the gate that guards it.

## The structural result, stated once

The dictionary is not the problem. **All 2,300 cells exist, no cell is empty, no interpolation token has drifted, and the bundle on www.verzatv.com is byte-identical to source.** `npx tsc --noEmit` structurally guarantees key presence — deleting `ko["legal.refund"]` from a scratch copy produces `TS2741` — so a missing key cannot ship.

The problem is that **63 of the 115 keys are never rendered**, and the screens they were written for print English literals instead. 1,260 of the 2,300 audited cells are translated text nobody will ever see, while the same words sit hard-coded in English one file away.

| Key class | Keys | Cells |
|---|---|---|
| Rendered by live code | 52 | 1,040 |
| Referenced only from files with zero importers | 8 | 160 |
| Referenced nowhere at all | 55 | 1,100 |
| **Unrendered total** | **63** | **1,260** |

Untranslated (byte-identical to `en`) cells: **299 of 2,185** non-`en` cells = 13.7%. Of those, **247 sit in unrendered keys** and 52 in rendered ones.

## Findings

### S2

**D2-001 — 63 keys / 1,260 cells are translated but unreachable.**
Grepping every `.ts`/`.tsx`/`.mjs` outside `lib/i18n.ts` for each of the 115 key literals: 55 keys appear nowhere; 8 more appear only in `components/CoinPaywall.tsx`, `components/SeriesInfoButton.tsx`, `components/SeriesInfoDrawer.tsx` — all three have **zero importers**. Confirmed from the other side on production: `/me` renders 21 visible strings byte-identical to an `en` dictionary value, `/sign-up` renders 17, and the only occurrence of `"Report a Problem"` in any deployed JS chunk is *inside the dictionary object itself* (`chunks/428d7hhx0m19l.js`, `chunks/3ss2oj_el4_hc.js`) — never as a `t()` argument.
Unreferenced set: `nav.widescreen`, `header.followUs`, `browse.*`(4), `horizontal.widescreen/play/pause`, `profile.*`(15 of 16), `library.comingSoon`, `library.shows`, `auth.*`(12), `legal.*`(3), `misc.*`(3), `content.cast/views/now/allEpisodes/previous/next/episodeOf/trending/watchFree/unlockSeries/tryAgain`.

**D2-002 — the show page renders its sales copy in English in all 20 locales.** *(money-adjacent)*
Phase 1 (`9b2fc27`) made `/series/<slug>` the destination of every poster tap. `app/series/[slug]/page.tsx` is a Server Component, so `t()` is architecturally unavailable (AGENTS.md rule 13):
- `:236` `Cast` — `content.cast` exists in 20 locales
- `:284` `"All Episodes FREE"`, `:285` `` `First ${series.freeEpisodes} Episodes FREE` `` — no key
- `:307` `Watch Episode 1 Free` — `content.watchFree` exists in 20 locales
- `:346` `Series Unlock` — no key

96 show pages. The only localized element on the page is the leaf client component `AudioLanguageBadge` (`:195`) — and see D2-006 for what that renders in two locales.

**D2-003 — the Profile screen hard-codes 16 strings that are fully translated in all 20 locales.**
`app/me/page.tsx` is a Server Component (`getUser()`, `getVipStatusServer()`) passing `label="…"` literals: `:251` "Guest", `:254` "Sign in to sync your library and purchases", `:263` "Sign In", `:310` "Library", `:314` "My List", `:320` "Continue Watching", `:326` "Purchase History", `:376` "Help & FAQs", `:381` "Send Feedback", `:387` "Report a Problem", `:407/:412/:417` the three legal links. Plus `components/ProfileDynamic.tsx:95` "Dark Mode", `:226` "Sign Out", `components/PushNotificationToggle.tsx:143` "Notifications". Exactly one row localizes: "Language" (`components/LanguagePicker.tsx:36,61`).

### S3

**D2-004 — 228 cells across 12 locales are verbatim English.**
`zh, hi, ar, ru, tr, pl, nl, th, vi, id, tl, sw` each carry 19 of 20 `content.*` values byte-identical to English. `lib/i18n.ts:592` (zh) is representative — `"content.synopsis": "Synopsis" … "content.freeEpisodeOf": "免费第 {n} 集，共 {total} 集" … "content.trending": "Trending"` — the single translated key is the one later patched in isolation. Independent confirmation: `zh/hi/ar/ru/th` each carry 20 values with *zero characters in their own script*. Commit `8d6dc8e` is titled "All 20 languages fully translated (was English fallback for 16)". Mitigated only by D2-001: nobody sees these today.

**D2-005 — Arabic renders left-to-right.**
Across all 23 JS chunks and 6 CSS files behind 8 production pages: `documentElement.dir` — **zero hits** (`documentElement.lang` has five). `[dir=`, `:dir(`, `direction:rtl` in CSS — **zero hits**; every `direction:` is `flex-direction`. The one RTL declaration in the product is the paywall overlay, live in `chunks/27_6kgf3tx4s2.js` as `lang:X,dir:"ar"===X?"rtl":void 0` (= `components/EpisodeFeed.tsx:2511`). `app/layout.tsx:107` hard-codes `<html lang="en">` with no `dir`. Even inside that one container the utilities stay physical: `text-left` (`:2535`), `ml-2` (`:2561`).

**D2-006 — the wrong-language guard is itself garbled in Arabic and Vietnamese.** *(money-adjacent)*
`lib/i18n.ts:714` `"الصوت بال{language}"` + `Intl.DisplayNames('ar').of('en')` = `"الإنجليزية"` (already carries `ال`) → **`الصوت بالالإنجليزية`**. `:1014` `"Tiếng {language}"` + `DisplayNames('vi').of('en')` = `"Tiếng Anh"` → **`Tiếng Tiếng Anh`**. All three spoken languages (`en`/`es`/`hi`) and both `language.audioSubs` slots. Rendered once per show page (`components/AudioLanguageBadge.tsx:52,56` ← `app/series/[slug]/page.tsx:195`), confirmed live. `lib/audio-language.ts` states this label exists because "a buyer found out after paying". Lesser siblings: nl `"Audio in Engels"` (missing *het*), th `"เสียง อังกฤษ"` (a space Thai doesn't use).

**D2-007 — no plural rules; the paywall is ungrammatical in Russian on 20/86 paid series.** *(money-adjacent)*
`grep -r 'Intl.PluralRules'` over `app/ components/ lib/` → **zero hits**. Resolving every paid live row against `MUX_MAP` and rendering `paywall.benefitEpisodes` (`components/EpisodeFeed.tsx:2537`):

- ru template `"Все {count} серий сразу"` uses the *many* form. Catalog counts 41, 51, 61 are `PluralRules('ru').select` → **one** (16 series: `the-mistress-trap`, `the-blackthornes`, `destined-to-be`, `the-winter-veil`, `the-haunted-sisters`, `the-missing-piece`, `duty-of-desire`, `faded-threads`, `mafia-lords-secret-love`, `my-celebrity-boyfriend-killed-me`, `good-for-him`, `runaway-bride`, `honey-gold`, `the-crown`, `the-inheritance-game`, `im-having-my-professors-baby-es`). Counts 52, 54, 62 → **few** (4 series). → `"Все 61 серий сразу"`; correct is `серия`.
- pl `"Wszystkie {count} odcinków"` breaks on 52/54/62 → `"Wszystkie 62 odcinków"`; correct is `odcinki`.

`content.freeEpisodeOf` is plural-safe by construction (`{n} of {total}` with no agreeing noun) and correct in all 20.

**D2-008 — Filipino auto-detection never fires.**
`resolveLocale(['fil-PH'])` → `null` → English. `resolveLocale(['tl-PH'])` → `'tl'`. Chrome and Safari emit `fil`; `tl` is the legacy code. `lib/i18n.ts:1236` does a literal `LOCALES.find(l => l.code === primary)` against `{ code: "tl", … }` (`:11`). ICU already treats them as one — `Intl.NumberFormat.supportedLocalesOf(['tl'])` canonicalizes to `fil` — so only this table lookup disagrees. Same class: `in-ID` (legacy Indonesian) → English. Manual selection still works.

**D2-010 — the gate covers 26 of 115 keys and cannot see an English fallback.**
I re-implemented `scripts/test-feed-integrity.mjs:2036-2077` verbatim and ran it against mutated dictionary copies (no repo file touched):

| Mutation | Result |
|---|---|
| delete `pl.paywall.cta` | **FAIL — caught** |
| drop `{price}` from `ru.paywall.cta` | **FAIL — caught** |
| remove "Stripe" from `de.paywall.secure` | **FAIL — caught** |
| replace the **entire `es` paywall block** with English | **PASS — blind** |
| replace **all 100 non-paywall `ja` keys** with English | **PASS — blind** |
| drop `{n}`/`{total}` from `fr.content.episodeOf` | **PASS — blind** |

Cause: `:2039-2041` filters to `paywall.*`/`checkout.*`/`language.*` (26 keys); `:2044-2050` whitelists placeholders for 5 keys; nothing anywhere compares against `dictionaries.en`. Standing rule 3 is *satisfied* on placement — every check sits above the terminal `process.exit(1)` at `:2373`, and `npm run test:feed-integrity` currently PASSes with all 4,913 episodes walked. The gap is scope, not ordering. This is precisely how 228 English cells and 55 unwired keys ship green.

**D2-009 — `zh-Hant`/`zh-TW`/`zh-HK` all collapse to Simplified `zh`.** `lib/i18n.ts:1236` discards the script subtag — correct for `es-419`/`es-MX`, silently wrong for Han. `LangDropdown` offers one 中文. Same class, lower stakes: `pt` is Brazilian ("Você acabou de ver", "neste app") and serves `pt-PT`.

### S4 (summarised)

- **D2-011** — 52 rendered cells untranslated: `shorts.soundOn/soundOff` = "On"/"Off" in es/fr/pt/it/id/tl while zh (开/关), ja, ko, ru, th *do* translate them; `tab.popular` "Hot" in all 19 (plausibly deliberate — flagged, not asserted); `tab.drama` 8, `tab.reality` 7, `nav.shorts` 2, `tab.redCarpet` 2, `nav.shop` 1 (de), `nav.profile` 1 (tl).
- **D2-012** — dates/numbers ignore the UI locale: `PurchaseHistoryList.tsx:47` `toLocaleDateString(undefined, …)` uses the **browser** locale; `VipCard.tsx:126` and `lib/coins.ts:18` hard-code `en-US`. `formatMoney` is the only locale-aware formatter in the product.
- **D2-013** — the **Anime empty state** (DO-NOT-REGRESS house pattern) is English-only: `BrowsePage.tsx:716,718-721,729`. The state itself is good; only its localization is missing. Unlike D2-002/003 this is a client component, so it is a missed call site, not a boundary.
- **D2-014** — `lib/price.ts:38-45` claims Intl "disambiguates the dollar sign on its own". Measured: `en, de, ja, hi, ru, tr, tl` render a **bare `$`**. Practical risk low (es/pt — the stated peso worry — do get `US$`); recorded under standing rule 5 as a false inherited fact.
- **D2-015** — copy quality: pl `paywall.previewOver` is masculine-only (`obejrzałeś`); hi spells the same word two ways (`मुफ्त` / `मुफ़्त`); tr mixes formal and informal register; fr omits the narrow no-break space in `Copié!`, `Pas de compte?`, `Déjà un compte?`. Clean elsewhere: zero mojibake, zero U+FFFD, zero straight apostrophes, no padding, Spanish `¿`/`¡` complete, no ASCII punctuation in ja/zh sentences, brand tokens intact in all 20.
- **D2-016** — English-only accessible names: `LangDropdown.tsx:28` `aria-label="Change language"` (the language control is itself unlocalized), `EpisodeFeed.tsx:1111/2191/2312/2332/2372/2418`, `EpisodeDropdown.tsx:148` "FREE". Phase 1 added more (`"All categories"`, `"Back to profile"`, `"Categories"`, `"Close"`, `"Reset Password"`). `misc.close` exists in 20 locales, unused.
- **D2-017** — 20 locales, zero localized URLs: every page ships `lang="en"` (corrected only in an effect), `alternates` is canonical-only in ~20 files, no `hreflang`. A documented consequence of AGENTS.md rule 13, recorded so the trade-off is visible.
- **D2-018** — 257 catalog strings (96 titles, 96 loglines, 65 genres) are English in all 20 locales, including inside translated sentences: ru paywall reads `Вы только что посмотрели бесплатный фрагмент «The Escort They Framed»`.
- **D2-019** — `interpolate` (`lib/i18n.ts:1195`) substitutes raw `String(n)`, bypassing locale grouping and numbering systems. Latent only: max injected value is 62. Its unknown-placeholder branch is correct and deliberate — one of those tokens is `{price}`.

## What is genuinely right — do not regress it

**The paywall and checkout are the best-localized surface in the product, and the brief's question about them is answered YES.** Commit `9b2fc27` added exactly 26 keys (13 `paywall.*`, 11 `checkout.*`, 2 `language.*`). All **520 cells present**, **0 identical to English**, **0 token drift** — verified in source *and* in the deployed bundle. The overlay declares `lang={locale}` and `dir="rtl"` for Arabic (`EpisodeFeed.tsx:2508-2511`). The price is formatted by `Intl` from the one canonical constant, not concatenated. `paywall.secure` names Stripe in all 20. `paywall.goBack` translates in all 20 and is a real `<a href>` at full opacity. The reordering-by-placeholder design (`{price}`, `{count}`, `{title}`) is the right call and it held.

`content.freeEpisodeOf` is translated and token-correct in all 20 and reads correctly at `n=3, total=5` in every one. The `en` dictionary uses U+2019 throughout. `resolveLocale` correctly folds `es-419`/`es-MX`/`es-ES`, `pt-BR`/`pt-PT`, `de-AT`/`de-CH`, `fr-CA`, `nl-BE`, `ar-EG`/`ar-SA`, `sw-KE`/`sw-TZ`. `ContentTranslator` correctly removed a CSP-blocked Google Translate injection rather than whitelisting a host that would have machine-retranslated the paywall.

## Method note

Dictionaries were transpiled from `lib/i18n.ts` with the repo's own TypeScript and loaded as data — no string matching against source (standing rule 6). Plural and routing findings were resolved against real `MUX_MAP`/`lib/catalog.ts` rows, not sampled. The gate finding is negative-controlled in both directions (standing rule 3). Every finding was re-confirmed against the dictionary object extracted from the live chunk at `https://www.verzatv.com/_next/static/immutable/chunks/428d7hhx0m19l.js` — 2,300/2,300 cells identical to source, so nothing here is a build-only artefact (standing rule 4). No application file was modified.