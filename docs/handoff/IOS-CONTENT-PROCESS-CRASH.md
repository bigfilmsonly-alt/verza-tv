# iOS "This page couldn't load" on the episode feed

**Reported:** 2026-08-19, iPhone / Safari / 5G, on `verzatv.com/series/falling-for-flatmate/30`.
**Status:** low-risk fixes shipped. Playback-risk fixes below still open, deliberately.

## What the error is

Safari's "This page couldn't load / Reload to try again, or go back." is **not** an HTTP
error. It means the WebContent process was terminated — on iOS, almost always jetsam
reclaiming memory. Confirmed the server is fine: all 60 episodes of that series return
200, and the apex domain 308-redirects to www correctly.

## Root cause

**Cumulative footprint, not one leak.** The page's standing memory was already near the
device ceiling before video allocated anything.

1. **The code's central assumption about iOS was false.** Three files carried a comment
   saying native HLS is used on iOS because "iOS Safari has no MSE". hls.js resolves
   `ManagedMediaSource` first, and iPhone Safari has shipped it since **iOS 17.1**. So
   `Hls.isSupported()` is `true` on a modern iPhone and the **MSE branch runs there** —
   each attached slide carries a transmux Worker + SourceBuffer + decoder, not the single
   cheap native element the code was written for. Every per-slide cost estimate in this
   codebase was therefore wrong on the one device that crashed.
2. **Three pipelines are attached at once.** `shouldLoad = isActive || isNear` with
   `isNear = |i - activeIndex| <= 1`.
3. **The rendition cap never binds.** `capLevelToPlayerSize: true` is set, but hls.js
   multiplies by `devicePixelRatio` with `maxDevicePixelRatio` defaulting to `Infinity`.
   At DPR 3 a 393px element reports ~1179px — larger than every Mux rendition — so no cap
   is applied and each pipeline pulls 1080p.
4. **The browse grid held the whole catalogue as decoded bitmaps.** ~78 tiles, no
   virtualization, plus all four hero layers mounted at full size permanently.
5. **The two overlapped by design.** The instant player allocates a hidden video pipeline
   from the poster click handler, i.e. while the browse page and all its decoded posters
   are still mounted. That overlap is the peak.

## Shipped (low risk, no playback behaviour change)

- `next.config.ts` — added `deviceSizes`/`imageSizes`. Next's defaults jump 384 → 640, so
  a 33vw tile on a DPR-3 iPhone rounded **up** to the 640w candidate (~2.7MB decoded for a
  ~130×195 box). The new 448/512 entries land just above what the widest iPhone needs.
- `components/BrowsePage.tsx` — hero mounts 2 layers instead of all slides (a crossfade
  needs exactly two); grid paginates at 24 with an IntersectionObserver sentinel 800px
  ahead, so scrolling still reads as continuous.
- `components/EpisodeFeed.tsx` — unmount teardown now clears `src` + `load()` like the
  file's three other teardown paths. **This was NOT the crash cause** — when an Hls
  instance exists, `destroy()` already does this internally. It only does real work on the
  native-HLS branch. Kept for symmetry.
- Stale "iOS Safari has no MSE" comments corrected in `EpisodeFeed`, `ShortsFeed`,
  `HorizontalFeed`. These comments were the proximate cause of the whole class of bug.

## Open, deliberately (touches playback — needs on-device review)

Ordered. Do not ship as one commit; verify on a real iPhone between each.

- **P1 — cap the rendition.** Add `maxDevicePixelRatio: 1` to the `EpisodeFeed` Hls config
  so `capLevelToPlayerSize` actually binds (~390 CSS px → 480p/540p). Roughly halves decode
  + buffer per pipeline. Visible-quality decision; consider gating to iOS if desktop
  regresses. **Not** a blind copy to `lib/instant-player.ts`: that element is deliberately
  2px square, so capping to player size there would select the *worst* rendition and keep
  it after the element goes full-screen on adoption.
- **P2 — drop the duplicate ERROR handler.** `lib/instant-player.ts` registers one at
  construction; `EpisodeFeed` adds a second after adoption and neither calls `.off()`. One
  fatal media error — the normal iOS signal of decoder pressure — therefore triggers two
  `recoverMediaError()` rebuilds, i.e. an allocation burst exactly when memory is tight.
- **P3 — one look-ahead, forward only.** `isNear={i - activeIndex === 1}` takes attached
  pipelines 3 → 2. Tradeoff: a backward swipe re-attaches instead of resuming a warm
  buffer. Lower-risk variant: keep ±1 but `stopLoad()` the non-active slides instead of
  only pausing them.
- **P4 — `/horizontal`.** 15 cards mount at once, each keeping its Hls instance until
  unmount. Mitigated today by `preload="none"`. Separate surface; may not be implicated.
- **P5 — keep `MUX_MAP` out of the player route's client graph.** `Header` → `SearchButton`
  → `lib/catalog` → `lib/mux-map` puts a **390KB chunk with all 4,616 playback ids** on
  every route, including the immersive player where the header is hidden by CSS. Verified
  by measuring the episode page's chunks: it is the largest asset on the page. Headroom,
  not trigger.

## Guardrails

`scripts/audit-perf.ts` (`npm run audit:perf`) pins each mistake above: image breakpoints,
grid pagination, hero layer count, stale iOS/MSE claims, rendition capping, and duplicate
ERROR handlers. It fails the build on the shipped fixes regressing and warns on the open
items. `scripts/audit-content.ts` (`npm run audit`) continues to guard catalog/Mux
integrity.

## What is not proven

Every megabyte figure is computed from source dimensions × the srcset candidate the
browser will pick — arithmetic, not measurement. Nobody has profiled the actual device.
**The single highest-value confirmation is one line in Safari's remote inspector on a real
iPhone: `Hls.isSupported()`.** If that is `true`, the MSE analysis and P1/P3 are correct.
It is also unproven whether the reporter's session included a poster tap (which would add
the browse-page memory) or was a cold deep link (which would make the player items the only
ones that matter). Episode 30 appears incidental — nothing in the attach path is
episode-index dependent.
