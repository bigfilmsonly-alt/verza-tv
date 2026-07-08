#!/usr/bin/env python3
"""
Compact placement summary from the cached input-info folder data.

Reads scripts/out/placement.json (playbackId -> {folder,file,...}) and
lib/mux-map.ts (series slug -> [(episode, playbackId)]). For each series it
reports how many of its episodes come from its OWN dominant source folder vs
a foreign show's folder, and names the foreign owners. Also lists which single
source folder got split across multiple series slugs.

Writes: scripts/out/placement-summary.md   (human-readable, compact)
"""
import json, os, re
from collections import defaultdict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "scripts", "out")
cache = json.load(open(os.path.join(OUT, "placement.json")))

mapsrc = open(os.path.join(ROOT, "lib", "mux-map.ts")).read()
series = {}
for block in re.finditer(r'"([^"]+)":\s*\[([\s\S]*?)\]', mapsrc):
    slug = block.group(1)
    eps = [(int(e), p) for e, p in
           re.findall(r'episode:\s*(\d+),\s*playbackId:\s*"([^"]+)"', block.group(2))]
    if eps:
        series[slug] = eps

# folder -> series -> count (to name owners)
folder2series = defaultdict(Counter)
for slug, eps in series.items():
    for e, p in eps:
        f = cache.get(p, {}).get("folder")
        if f:
            folder2series[f][slug] += 1

def owner_of(folder, exclude):
    c = folder2series.get(folder, {})
    names = [s for s in c if s != exclude]
    return ", ".join(names) if names else "unknown"

rows = []
for slug, eps in series.items():
    folders = Counter(cache.get(p, {}).get("folder") for e, p in eps)
    dom = folders.most_common(1)[0][0] if folders else None
    own = sum(1 for e, p in eps if cache.get(p, {}).get("folder") == dom)
    foreign = [(e, cache.get(p, {}).get("folder")) for e, p in eps
               if cache.get(p, {}).get("folder") and cache.get(p, {}).get("folder") != dom]
    rows.append((slug, len(eps), own, foreign, dom))

rows.sort(key=lambda r: len(r[3]), reverse=True)

lines = ["# Placement Summary — episodes in the right vs wrong show", ""]
lines.append(f"- Series: {len(series)}   Episodes: {sum(len(e) for e in series.values())}")
clean = [r for r in rows if not r[3]]
dirty = [r for r in rows if r[3]]
lines.append(f"- Clean (all episodes from ONE source folder): {len(clean)}")
lines.append(f"- Contaminated (has episodes from another show): {len(dirty)}")
lines.append("")

lines.append("## CONTAMINATED — how many foreign episodes, and where they came from")
lines.append("| series | eps | correct | foreign | foreign came from |")
lines.append("|---|---|---|---|---|")
for slug, n, own, foreign, dom in dirty:
    owners = Counter(owner_of(f, slug) for e, f in foreign)
    src = "; ".join(f"{name}×{c}" for name, c in owners.most_common())
    lines.append(f"| {slug} | {n} | {own} | {len(foreign)} | {src} |")

lines.append("")
lines.append("## CLEAN series (every episode from its own folder)")
lines.append(", ".join(r[0] for r in clean) if clean else "none")

open(os.path.join(OUT, "placement-summary.md"), "w").write("\n".join(lines))
print("\n".join(lines))
