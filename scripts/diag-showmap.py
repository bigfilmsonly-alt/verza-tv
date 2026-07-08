#!/usr/bin/env python3
"""
DIAGNOSTIC (read-only, writes nothing to lib/). Collapse Dropbox to SHOW level,
match each catalog slug to its Dropbox show by NAME (slugs preserve original show
names even though catalog TITLES were re-branded), and report coverage so we can
verify the slug->show->folder chain BEFORE regenerating lib/mux-map.ts.
"""
import json, os, re
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "scripts", "out")

media = json.load(open(os.path.join(OUT, "dropbox-media.json")))
catsrc = open(os.path.join(ROOT, "lib", "catalog.ts")).read()

# --- catalog slugs (+title, status) ---
slugs = []
for m in re.finditer(r'slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?status:\s*"([a-z_]+)"', catsrc):
    slugs.append({"slug": m.group(1), "title": m.group(2), "status": m.group(3)})

def epnum(name):
    for pat in (r"\((\d+)\)", r"[Ee][Pp]\.?\s*_?(\d+)", r"(?:^|[^0-9])(\d{1,3})(?=\.[A-Za-z0-9]+$)"):
        mm = re.search(pat, name)
        if mm: return int(mm.group(1))
    return None

# Bundle / version-subfolder path segments that are NOT the show name.
BUNDLE = re.compile(r"(catalogue$|catalogue srt|^\d+ dramas|verzatv|panel|head\s*shots?)", re.I)
VERSION = re.compile(r"^(subtitled|subbed|sub|subtitle|clean.*|.*&\s*srt|srt.*|final|成品|posters?|no ?subtitle.*|.*srt$|burned)$", re.I)

def show_dir(path):
    """Return the SHOW-level folder path (strip version subfolder, keep show)."""
    parts = path.split("/")  # /Verza TV Team Folder/.../file
    # drop filename
    segs = parts[1:-1]  # after leading '' ... path_display starts with /
    # segs[0] == 'Verza TV Team Folder'
    segs = [s for s in segs if s != "Verza TV Team Folder"]
    # strip trailing version segs
    while segs and VERSION.match(segs[-1].strip()):
        segs.pop()
    # strip bundle prefixes
    segs = [s for s in segs if not BUNDLE.search(s.strip())]
    if not segs:
        return None
    return "/".join(segs)

# show -> {ep: dur}
show_eps = defaultdict(dict)
for m in media:
    d = m.get("duration")
    if not d or d <= 0: continue
    e = epnum(m["name"])
    if e is None: continue
    sd = show_dir(m["path"])
    if not sd: continue
    show_eps[sd].setdefault(e, round(d))

shows = {s: eps for s, eps in show_eps.items() if len(eps) >= 5}

def norm(x):
    x = x.lower()
    x = re.sub(r"[《》''\"!！?？.,\-_&()（）\s]", "", x)
    x = x.replace("part", "").replace("season", "s").replace("nosubtitle", "")
    return x

# leaf name of a show dir
def leaf(s):
    return s.split("/")[-1]

show_norm = {s: norm(leaf(s)) for s in shows}

print(f"Dropbox SHOW dirs (>=5 eps): {len(shows)}\n")

# match each slug -> show
manual = {}  # fill after seeing gaps
used = set()
rows = []
for si in sorted(slugs, key=lambda x: x["slug"]):
    slug = si["slug"]
    keys = [norm(slug.replace("-", " ")), norm(si["title"])]
    best, bs = None, 0
    for s, sn in show_norm.items():
        for k in keys:
            if not k: continue
            # containment score
            if k == sn: sc = 100
            elif k in sn or sn in k: sc = 80 + min(len(k), len(sn))
            else:
                # token overlap
                a, b = set(re.findall(r"[a-z]+", slug.replace("-", " "))), set(re.findall(r"[a-z]+", leaf(s).lower()))
                sc = 40 * len(a & b) / max(1, len(a | b))
            if sc > bs: bs, best = sc, s
    rows.append((slug, si["status"], round(bs), best, len(shows.get(best, {}))))

for slug, st, sc, best, n in rows:
    flag = "" if sc >= 80 else "  <-- WEAK"
    print(f"{sc:4} {st:11} {slug:42} -> {leaf(best) if best else '?':40} ({n}ep){flag}")

matched = {r[3] for r in rows if r[2] >= 80}
print(f"\nUnmatched Dropbox shows ({len(shows)-len(matched)}):")
for s in sorted(shows):
    if s not in matched:
        print(f"   {s}  ({len(shows[s])}ep)")
