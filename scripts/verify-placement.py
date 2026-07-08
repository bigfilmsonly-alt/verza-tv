#!/usr/bin/env python3
"""
Verify every mapped episode belongs to its series' source folder.

Each Mux asset was ingested from Supabase storage: one folder UUID per show.
For every episode in lib/mux-map.ts we resolve its source folder via the Mux
input-info API and check that all episodes of a series share ONE folder.
A foreign folder = a video placed in the wrong series.

Reads:  scripts/out/mux-assets.json (playback_id -> asset_id), lib/mux-map.ts
Writes: scripts/out/placement.json (cache), scripts/out/placement-report.md
Env:    MUX_TOKEN_ID, MUX_TOKEN_SECRET  (source .env.local first)
"""
import json, os, re, sys, base64, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "scripts", "out")
CACHE = os.path.join(OUT, "placement.json")
REPORT = os.path.join(OUT, "placement-report.md")

TID = os.environ.get("MUX_TOKEN_ID"); TS = os.environ.get("MUX_TOKEN_SECRET")
if not TID or not TS:
    sys.exit("ERROR: source .env.local first (MUX_TOKEN_ID / MUX_TOKEN_SECRET)")
AUTH = "Basic " + base64.b64encode(f"{TID}:{TS}".encode()).decode()

# playback_id -> asset_id
assets = json.load(open(os.path.join(OUT, "mux-assets.json")))
pid2aid = {a["playback_id"]: a["asset_id"] for a in assets}

# series -> [(episode, playbackId)]
mapsrc = open(os.path.join(ROOT, "lib", "mux-map.ts")).read()
series = {}
for block in re.finditer(r'"([^"]+)":\s*\[([\s\S]*?)\]', mapsrc):
    slug = block.group(1)
    eps = [(int(e), p) for e, p in
           re.findall(r'episode:\s*(\d+),\s*playbackId:\s*"([^"]+)"', block.group(2))]
    if eps:
        series[slug] = eps

cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

import time
def folder_of(pid):
    if cache.get(pid, {}).get("folder"):
        return cache[pid]
    aid = pid2aid.get(pid)
    if not aid:
        cache[pid] = {"folder": None, "file": None, "err": "no-asset"}; return cache[pid]
    for attempt in range(6):
        try:
            req = urllib.request.Request(
                f"https://api.mux.com/video/v1/assets/{aid}/input-info",
                headers={"Authorization": AUTH, "User-Agent": "verza-verify"})
            data = json.load(urllib.request.urlopen(req, timeout=30))["data"]
            url = data[0]["settings"]["url"]
            m = re.search(r"/public/[^/]+/([0-9a-f-]{36})/([0-9a-f-]{36})", url)
            cache[pid] = {"folder": m.group(1) if m else None,
                          "file": m.group(2) if m else None, "url": url}
            return cache[pid]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(1.5 * (attempt + 1)); continue
            cache[pid] = {"folder": None, "file": None, "err": f"HTTP{e.code}"}; return cache[pid]
        except Exception as e:
            time.sleep(1.0);
            if attempt == 5:
                cache[pid] = {"folder": None, "file": None, "err": str(e)[:80]}
    return cache.get(pid, {"folder": None, "file": None, "err": "429-exhausted"})

all_pids = [p for eps in series.values() for _, p in eps]
todo = [p for p in all_pids if not cache.get(p, {}).get("folder")]
print(f"{len(series)} series, {len(all_pids)} episodes, {len(todo)} to fetch")

done = 0
with ThreadPoolExecutor(max_workers=4) as ex:
    for _ in ex.map(folder_of, todo):
        done += 1
        if done % 400 == 0:
            print(f"  {done}/{len(todo)}")
json.dump(cache, open(CACHE, "w"))

# ---- analyze ----
lines = ["# Episode Placement Verification", ""]
folder2series = defaultdict(Counter)  # folder -> series -> count
clean, contaminated, errors = [], [], []
for slug, eps in series.items():
    folders = Counter()
    for e, p in eps:
        f = cache[p]["folder"]
        folders[f] += 1
        if f: folder2series[f][slug] += 1
    dominant = folders.most_common(1)[0][0] if folders else None
    foreign = [(e, p, cache[p]["folder"]) for e, p in eps
               if cache[p]["folder"] and cache[p]["folder"] != dominant]
    missing = [(e, p) for e, p in eps if not cache[p]["folder"]]
    if len(folders) == 1 and None not in folders:
        clean.append(slug)
    elif foreign:
        contaminated.append((slug, dominant, foreign, missing))
    if missing:
        errors.append((slug, missing))

lines.append(f"- Series checked: {len(series)}")
lines.append(f"- Episodes checked: {len(all_pids)}")
lines.append(f"- Clean (all episodes from ONE source folder): {len(clean)}")
lines.append(f"- Contaminated (episodes from a foreign show folder): {len(contaminated)}")
lines.append(f"- Series with unresolved episodes: {len(errors)}")

# folders claimed by >1 series (a show folder split across series slugs)
shared = {f: dict(c) for f, c in folder2series.items() if len(c) > 1}
lines.append(f"- Source folders shared by multiple series: {len(shared)}")
lines.append("")

lines.append("## CONTAMINATED SERIES (videos in the wrong show)")
if not contaminated:
    lines.append("NONE — every episode traces to its series' own source folder.")
for slug, dom, foreign, missing in contaminated:
    lines.append(f"\n### {slug}")
    lines.append(f"- dominant folder: `{dom}`")
    for e, p, f in foreign:
        also = folder2series.get(f, {})
        owner = ", ".join(s for s in also if s != slug) or "unknown"
        lines.append(f"- EP{e} → foreign folder `{f}` (belongs to: {owner}) pid={p[:16]}…")

if shared:
    lines.append("\n## SOURCE FOLDERS SPLIT ACROSS MULTIPLE SERIES")
    for f, c in shared.items():
        lines.append(f"- `{f}` → {c}")

if errors:
    lines.append("\n## UNRESOLVED (no source folder from Mux)")
    for slug, missing in errors:
        lines.append(f"- {slug}: {len(missing)} eps unresolved")

lines.append("\n## CLEAN SERIES")
lines.append(", ".join(clean) if clean else "none")

open(REPORT, "w").write("\n".join(lines))
print("\n".join(lines[:14]))
print(f"\nFull report: {REPORT}")
