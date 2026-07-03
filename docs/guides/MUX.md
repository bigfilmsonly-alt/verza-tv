# Mux Video Pipeline

How video playback works on Verza TV -- from Mux assets to the user's screen.

---

## Overview

- **~4,100 Mux assets** (1080x1920 vertical, 30fps, stereo audio)
- **76 series** with episodes mapped to playback IDs
- HLS adaptive streaming via `stream.mux.com`
- Thumbnail generation via `image.mux.com`
- Player: hls.js (Chrome/Firefox) + native HLS (Safari/iOS)

---

## Mux Asset Mapping

### File: `lib/mux-map.ts`

The central mapping between content and video. Structure:

```ts
interface MuxEpisode {
  episode: number;      // Episode number within the series
  playbackId: string;   // Mux playback ID
  duration: number;     // Duration in seconds (from Mux)
}

const MUX_MAP: Record<string, MuxEpisode[]> = {
  "the-blackthornes": [
    { episode: 1, playbackId: "abc123...", duration: 68 },
    // ...
  ],
};
```

### Helper functions

```ts
// Get playback info for a specific episode
getPlayback(slug: string, episode: number): MuxEpisode | undefined

// Get a random playback ID (used by Shorts feed)
getRandomPlayback(): { slug: string; episode: number; playbackId: string } | undefined
```

---

## HLS Streaming

All video is delivered via HLS (HTTP Live Streaming) through Mux's CDN.

### Stream URL pattern
```
https://stream.mux.com/{playbackId}.m3u8
```

### Thumbnail URL pattern
```
https://image.mux.com/{playbackId}/thumbnail.jpg?time=5&width=720&height=1280
```

The `time` parameter selects the frame (in seconds) for the thumbnail. The Player component uses `time=2`, the playback API uses `time=5`.

---

## Player Implementation

### File: `components/Player.tsx`

A "use client" component that handles HLS playback across all browsers.

### Browser strategy

1. **Safari / iOS**: Native HLS support via `<video>` element's `canPlayType("application/vnd.apple.mpegurl")`
2. **Chrome / Firefox**: hls.js library polyfills HLS support
3. **Fallback**: Error message if neither is supported

### CRITICAL: Dynamic import of hls.js

hls.js **must** be dynamically imported. A static import crashes iOS Safari because the module probes for MSE (MediaSource Extensions) APIs that don't exist in Safari's HLS-native environment.

```ts
// CORRECT -- dynamic import, runs only in browser
import type HlsType from "hls.js";   // type-only import is safe

let HlsModule: typeof HlsType | null = null;
if (typeof window !== "undefined") {
  import("hls.js").then((m) => { HlsModule = m.default; }).catch(() => {});
}
```

Do NOT do this:
```ts
// WRONG -- static import crashes iOS Safari
import Hls from "hls.js";
```

### hls.js configuration

```ts
{
  maxBufferLength: 60,
  maxMaxBufferLength: 120,
  startLevel: -1,              // auto quality selection
  capLevelToPlayerSize: false,
  enableWorker: true,
  lowLatencyMode: false,
}
```

Error recovery is automatic: network errors trigger `startLoad()`, media errors trigger `recoverMediaError()`.

### ShortsFeed component

`components/ShortsFeed.tsx` uses the same dual-path pattern (native HLS + hls.js fallback) with a smaller buffer (`maxBufferLength: 30`) since shorts are short-lived.

---

## Playback API

### Endpoint: `GET /api/playback/[episode]`

**File**: `app/api/playback/[episode]/route.ts`

Resolves a series slug + episode number to a Mux playback URL.

### URL format
```
/api/playback/{slug}--{episodeNumber}
```

Example: `/api/playback/the-blackthornes--3`

### Free gate logic

- Episodes 1-5 (`FREE_EPISODES` constant from `lib/config.ts`) are free
- Paid episodes return HTTP **402** with paywall information
- No auth check for free episodes (public access)

### Responses

**200 -- Free episode available:**
```json
{
  "status": "ok",
  "series": "the-blackthornes",
  "episode": 3,
  "playbackId": "abc123...",
  "playbackUrl": "https://stream.mux.com/abc123.m3u8",
  "duration": 68,
  "poster": "https://image.mux.com/abc123/thumbnail.jpg?time=5&width=720&height=1280"
}
```

**402 -- Paid episode (paywall):**
```json
{
  "status": "paywall",
  "message": "This episode requires coins to unlock",
  "series": "the-blackthornes",
  "episode": 6,
  "coinCost": 49
}
```

**404 -- No video found:**
```json
{
  "status": "not_found",
  "message": "No video available for this episode"
}
```

**400 -- Invalid request:**
```json
{
  "error": "Invalid episode"
}
```

---

## Mux Credentials

Required environment variables in `.env.local`:

```
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
```

These are used for Mux API access (asset management, signed URLs). The public playback IDs in `mux-map.ts` do not require authentication -- they stream directly from `stream.mux.com`.

---

## Video Specifications

| Property | Value |
|----------|-------|
| Resolution | 1080x1920 (vertical / portrait) |
| Frame rate | 30 fps |
| Audio | Stereo |
| Format | HLS adaptive bitrate |
| Duration | Typically 30-280 seconds per episode |
| Total assets | ~4,100 episodes across 76 series |

---

## Architecture Diagram

```
User clicks Play
       |
       v
  Player.tsx (client component)
       |
       +-- Safari/iOS: native HLS via <video src="...m3u8">
       |
       +-- Chrome/Firefox: hls.js (dynamic import)
               |
               v
         stream.mux.com/{playbackId}.m3u8
               |
               v
         Mux CDN -> adaptive bitrate HLS segments
```

Thumbnails flow:
```
Poster/Preview image request
       |
       v
  image.mux.com/{playbackId}/thumbnail.jpg
       |
       v
  Mux image CDN -> server-rendered frame
```
