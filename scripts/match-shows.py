#!/usr/bin/env python3
"""
Match each Mux source-folder (a real show) to the correct Dropbox episode set
by video-duration fingerprint, then report the match quality. READ-ONLY: writes
a report + a machine-readable match file, but does NOT touch lib/mux-map.ts yet.

Inputs:
  scripts/out/dropbox-media.json  [{path,name,duration(sec)}]  (all versions)
  scripts/out/mux-assets.json     playback_id -> duration
  scripts/out/placement.json      playback_id -> {folder,...}
  lib/mux-map.ts                  slug -> [playbackId...]  (current WRONG map)
Outputs:
  scripts/out/match-report.md
  scripts/out/show-matches.json   folder -> {dir, name, score, n_folder, n_dir}
"""
import json, os, re
from collections import defaultdict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "scripts", "out")

media  = json.load(open(os.path.join(OUT, "dropbox-media.json")))
assets = json.load(open(os.path.join(OUT, "mux-assets.json")))
place  = json.load(open(os.path.join(OUT, "placement.json")))
mapsrc = open(os.path.join(ROOT, "lib", "mux-map.ts")).read()

mdur = {a["playback_id"]: a["duration"] for a in assets}
allp = set(re.findall(r'playbackId:\s*"([^"]+)"', mapsrc))

# current slug per playbackId (for naming hints only)
cur_slug = {}
for blk in re.finditer(r'"([a-z0-9-]+)":\s*\[([\s\S]*?)\]', mapsrc):
    for p in re.findall(r'playbackId:\s*"([^"]+)"', blk.group(2)):
        cur_slug[p] = blk.group(1)

# Mux folder -> {playbackId: duration}
folder_eps = defaultdict(dict)
for p in allp:
    f = place.get(p, {}).get("folder")
    if f and p in mdur:
        folder_eps[f][p] = mdur[p]

def epnum(name):
    for pat in (r"\((\d+)\)", r"[Ee][Pp]\.?\s*_?(\d+)", r"(?:^|[^0-9])(\d{1,3})(?=\.[A-Za-z0-9]+$)"):
        m = re.search(pat, name)
        if m: return int(m.group(1))
    return None

# Dropbox: directory -> {ep: duration}. A "candidate set" = a dir of numbered eps.
dir_eps = defaultdict(dict)
for m in media:
    d = m.get("duration")
    if not d or d <= 0: continue
    e = epnum(m["name"])
    if e is None: continue
    dirp = m["path"].rsplit("/", 1)[0]
    dir_eps[dirp].setdefault(e, round(d))
cands = {d: eps for d, eps in dir_eps.items() if len(eps) >= 5}

def overlap(mux_durs, dir_map, tol=1):
    """How many mux durations can be matched 1:1 to this dir's ep durations."""
    b = sorted(dir_map.values()); used = [False] * len(b); c = 0
    for x in sorted(mux_durs):
        for i, y in enumerate(b):
            if not used[i] and abs(x - y) <= tol:
                used[i] = True; c += 1; break
    return c

def show_name(dirp):
    parts = dirp.split("/")
    # skip generic leaf names, walk up to a meaningful show folder
    generic = re.compile(r"^(subtitled|subbed|clean.*|final|成品|posters?|srt.*)$", re.I)
    for seg in reversed(parts):
        if seg and not generic.match(seg) and seg != "Verza TV Team Folder":
            return seg
    return parts[-1]

# best candidate per mux folder
rows = []
for f, eps in folder_eps.items():
    durs = list(eps.values())
    scored = sorted(((overlap(durs, dm), len(dm), d) for d, dm in cands.items()),
                    reverse=True)
    best_s, best_n, best_d = scored[0]
    second = scored[1][0] if len(scored) > 1 else 0
    hint = Counter(cur_slug.get(p) for p in eps).most_common(1)[0][0]
    rows.append({"folder": f, "n_folder": len(durs), "dir": best_d,
                 "name": show_name(best_d), "score": best_s, "n_dir": best_n,
                 "second": second, "cur_hint": hint})

rows.sort(key=lambda r: r["score"] / max(1, r["n_folder"]))

matches = {r["folder"]: r for r in rows}
json.dump(matches, open(os.path.join(OUT, "show-matches.json"), "w"), indent=1)

lines = ["# Show match report (Mux folder -> Dropbox episode set by duration)", ""]
lines.append(f"- Mux folders: {len(rows)}   Dropbox candidate dirs: {len(cands)}")
strong = [r for r in rows if r["score"] >= 0.8 * r["n_folder"]]
lines.append(f"- Strong matches (>=80% of episodes line up): {len(strong)}")
lines.append(f"- Weak/ambiguous (needs a look): {len(rows) - len(strong)}")
lines.append("")
lines.append("| match% | folder_eps | dir_eps | 2nd | inferred show | current slug hint | dropbox dir |")
lines.append("|---|---|---|---|---|---|---|")
for r in rows:
    pct = round(100 * r["score"] / max(1, r["n_folder"]))
    lines.append(f"| {pct}% | {r['n_folder']} | {r['n_dir']} | {r['second']} | "
                 f"{r['name']} | {r['cur_hint']} | {r['dir'].replace('/Verza TV Team Folder/','')} |")
open(os.path.join(OUT, "match-report.md"), "w").write("\n".join(lines))
print("\n".join(lines))
