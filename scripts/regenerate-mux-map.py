#!/usr/bin/env python3
"""
Regenerate lib/mux-map.ts CORRECTLY (writes to scripts/out/mux-map.new.ts — does
NOT touch the live lib/mux-map.ts). Chain:

  catalog slug --(name)--> Dropbox show --(duration 1:1 assignment)--> Mux folder
                                          --(duration nearest)--> ordered episodes

Slugs preserve original show names (catalog TITLES were re-branded); Dropbox is the
source of truth for grouping + order. Mux holds zero ordering metadata, so every
join is by exact integer-second video DURATION.

Inputs (all read-only):
  scripts/out/dropbox-media.json  [{path,name,duration(sec)}]
  scripts/out/mux-assets.json     [{playback_id,duration}]
  scripts/out/placement.json      playbackId -> {folder,...}
  lib/catalog.ts                  slug/title/status
  lib/mux-map.ts                  current map (for preserved slugs + before/after)
Outputs:
  scripts/out/mux-map.new.ts
  scripts/out/regen-report.md
"""
import json, os, re, unicodedata
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "scripts", "out")

media  = json.load(open(os.path.join(OUT, "dropbox-media.json")))
assets = json.load(open(os.path.join(OUT, "mux-assets.json")))
place  = json.load(open(os.path.join(OUT, "placement.json")))
catsrc = open(os.path.join(ROOT, "lib", "catalog.ts")).read()
mapsrc = open(os.path.join(ROOT, "lib", "mux-map.ts")).read()

mdur = {a["playback_id"]: a["duration"] for a in assets}

# --- catalog slugs ---
CAT = []
for m in re.finditer(r'slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?status:\s*"([a-z_]+)"', catsrc):
    CAT.append({"slug": m.group(1), "title": m.group(2), "status": m.group(3)})

# --- current map: slug -> [playbackId...] (order as-is) ---
cur_map = {}
for blk in re.finditer(r'"([a-z0-9-]+)":\s*\[([\s\S]*?)\]', mapsrc):
    cur_map[blk.group(1)] = re.findall(r'playbackId:\s*"([^"]+)"', blk.group(2))

def norm(x):
    x = unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode()
    x = x.lower()
    x = x.replace("part", "").replace("season", "s")
    x = re.sub(r"[^a-z0-9]", "", x)
    return x

def epnum(name):
    for pat in (r"\((\d+)\)", r"[Ee][Pp]\.?\s*_?(\d+)", r"(?:^|[^0-9])(\d{1,3})(?=\.[A-Za-z0-9]+$)"):
        mm = re.search(pat, name)
        if mm: return int(mm.group(1))
    return None

BUNDLE  = re.compile(r"(catalogue|^\d+\s*dramas|verzatv|panel|head\s*shots?|"
                     r"^\d+\s*complete works|^complete works|the 9 new dramas|30 dramas)", re.I)
VERSION = re.compile(r"^(subtitled|subbed|sub|subtitle|clean.*|.*&\s*srt|srt.*|final|"
                     r"成品|posters?|te ?mp4|.*no ?subtitle.*|.*srt$|burned)$", re.I)

def show_key(path):
    """Normalized show identity from a Dropbox file path (strip bundles + version subfolders)."""
    segs = [s for s in path.split("/")[1:-1] if s != "Verza TV Team Folder"]
    while segs and VERSION.match(segs[-1].strip()):
        segs.pop()
    segs = [s for s in segs if not BUNDLE.search(s.strip())]
    if not segs:
        return None, None
    leaf = segs[-1]
    return norm(leaf), leaf

# Dropbox show (normalized) -> {ep: [durations]}, and a display label
show_eps  = defaultdict(lambda: defaultdict(list))
show_disp = {}
for m in media:
    d = m.get("duration")
    if not d or d <= 0: continue
    e = epnum(m["name"])
    if e is None: continue
    k, leaf = show_key(m["path"])
    if not k: continue
    show_eps[k][e].append(round(d))
    show_disp.setdefault(k, leaf)

# collapse to {ep: median duration}
def median(v):
    v = sorted(v); n = len(v); return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2
shows = {k: {e: median(v) for e, v in eps.items()} for k, eps in show_eps.items()}

# ---- slug -> show-normalized-key ----
# explicit overrides for re-branded / oddly-named / duplicate-name cases
OVR = {
    "the-blackthornes":                   norm("TheBlackthrones"),
    "the-escort":                         norm("TheEscort"),
    "the-dumb-billionaire-heiress-pt-2":  norm("The Dumb Billionaire Heiress In Love Part II"),
    "im-obsessed-with-my-boss-2":         norm("I'm Obsessed With My Boss Part II"),
    "im-obsessed-with-my-boss":           norm("I'm Obsessed With My Boss Part I"),
    "the-dumb-billionaire-heiress-in-love": norm("The Dumb Billionaire Heiress In Love Part I"),
    "duty-of-desire":                     norm("Duty Or Desire"),
    "echo-of-vengeance":                  norm("Echoes of Vengeance"),
    "mafia-lords-secret-love":            norm("Mafia Lord's Son Has Secret Love For His Stepmom"),
    "revenge-on-my-cheating-fiance":      norm("Revenge On My Cheating Fiance"),
    "the-billionaires-lost-love":         norm("The Billionaires Lost Love"),
    "the-billionaires-betrayal":          norm("BillionairesBetrayal"),
    "married-to-my-brothers-ex":          norm("Married to my brothers Ex"),
    "the-pendleton-secret":               norm("thependletonsecrete"),
    "duty-of-desire":                     norm("Duty Or Desire"),
    "tangled-in-desire":                  norm("Tangled in Desire"),
    "billionaire-daughters-love-triangle": norm("Billionaire Daughter's Love Triangle"),
}
# slugs with no Dropbox source: keep their current mux-map entry untouched
PRESERVE = {"too-much-junk", "the-carpet"}

def slug_to_show(si):
    slug = si["slug"]
    if slug in OVR:
        return OVR[slug]
    cands = [norm(slug.replace("-", " ")), norm(si["title"])]
    # exact
    for c in cands:
        if c in shows: return c
    # containment (prefer longest show key)
    best, bl = None, 0
    for k in shows:
        for c in cands:
            if c and (c in k or k in c) and len(k) > bl:
                bl, best = len(k), k
    return best

slug_show = {}
for si in CAT:
    if si["slug"] in PRESERVE:
        continue
    k = slug_to_show(si)
    slug_show[si["slug"]] = k

# ---- Mux folders: folder -> {playbackId: dur} ----
folder_eps = defaultdict(dict)
for p, dur in mdur.items():
    f = place.get(p, {}).get("folder")
    if f:
        folder_eps[f][p] = dur
folders = list(folder_eps.keys())

def overlap(mux_durs, show_durs, tol=1):
    b = sorted(show_durs); used = [False] * len(b); c = 0
    for x in sorted(mux_durs):
        for i, y in enumerate(b):
            if not used[i] and abs(x - y) <= tol:
                used[i] = True; c += 1; break
    return c

# ---- score matrix: show(normalized key) x folder ----
uniq_shows = sorted(set(k for k in slug_show.values() if k))
score = {}   # (show, folder) -> overlap
for k in uniq_shows:
    sd = list(shows[k].values())
    for f in folders:
        score[(k, f)] = overlap(list(folder_eps[f].values()), sd)

# ---- QUALITY-GATED greedy assignment ----
# A folder cleanly IS a show when the folder's assets are almost entirely explained
# by that show (coverage = overlap / folder_asset_count >= GATE). This correctly
# (a) identifies partial-episode folders (e.g. 42/42 assets all match) and
# (b) rejects force-fits onto duplicate/orphan folders. Shows with no gated folder
# are MISSING from Mux (duplicates of other shows were uploaded in their place).
GATE = 0.85
pairs = []
for k in uniq_shows:
    for f in folders:
        cov = score[(k, f)] / max(1, len(folder_eps[f]))
        if cov >= GATE:
            pairs.append((score[(k, f)], cov, k, f))
pairs.sort(reverse=True)
assign = {}; taken_f = set()
for ov_, cov, k, f in pairs:
    if k in assign or f in taken_f:
        continue
    assign[k] = f; taken_f.add(f)
missing_shows = [k for k in uniq_shows if k not in assign]

# ---- order each folder's playbackIds by episode via nearest duration ----
def order_episodes(folder, show_key_):
    fe = folder_eps[folder]                       # playbackId -> dur
    se = shows[show_key_]                          # ep -> dur
    pids = list(fe.keys()); eps = sorted(se.keys())
    pairs = []
    for pid in pids:
        for ep in eps:
            pairs.append((abs(fe[pid] - se[ep]), pid, ep))
    pairs.sort()
    used_pid, used_ep, pid_ep = set(), set(), {}
    for _, pid, ep in pairs:
        if pid in used_pid or ep in used_ep: continue
        pid_ep[pid] = ep; used_pid.add(pid); used_ep.add(ep)
    # leftover pids (folder had more assets than show eps) -> append after
    nextep = (max(eps) if eps else 0)
    for pid in pids:
        if pid not in pid_ep:
            nextep += 1; pid_ep[pid] = nextep
    ordered = sorted(pid_ep.items(), key=lambda kv: kv[1])
    return [{"episode": i + 1, "playbackId": pid, "duration": fe[pid]}
            for i, (pid, _) in enumerate(ordered)]

# ---- build new map (catalog order) ----
new_map = {}
warnings = []
used_folders = {}
for si in CAT:
    slug = si["slug"]
    if slug in PRESERVE:
        if slug not in cur_map:          # e.g. the-carpet has no current episodes
            continue
        new_map[slug] = [{"episode": i + 1, "playbackId": pid, "duration": mdur.get(pid, 0)}
                         for i, pid in enumerate(cur_map[slug])]
        continue
    k = slug_show.get(slug)
    if not k or k not in assign:
        warnings.append(f"{slug}: NOT in Mux (show='{show_disp.get(k,'?')}') — needs re-upload; kept CURRENT (wrong) entry")
        new_map[slug] = [{"episode": i + 1, "playbackId": pid, "duration": mdur.get(pid, 0)}
                         for i, pid in enumerate(cur_map.get(slug, []))]
        continue
    f = assign[k]
    if f in used_folders:
        warnings.append(f"{slug}: folder {f} ALSO used by {used_folders[f]} (collision)")
    used_folders[f] = slug
    new_map[slug] = order_episodes(f, k)

# ---- write mux-map.new.ts ----
lines = ["/* Auto-generated Mux playback mapping — REGENERATED (duration-verified) */",
         "", "export interface MuxEpisode {", "  episode: number;",
         "  playbackId: string;", "  duration: number;", "}", "",
         "export const MUX_MAP: Record<string, MuxEpisode[]> = {"]
for si in CAT:
    slug = si["slug"]
    if slug not in new_map: continue
    lines.append(f'  "{slug}": [')
    for e in new_map[slug]:
        lines.append(f'    {{ episode: {e["episode"]}, playbackId: "{e["playbackId"]}", duration: {e["duration"]} }},')
    lines.append("  ],")
lines.append("};")
lines += [
    "",
    "export function getPlayback(slug: string, episode: number): MuxEpisode | undefined {",
    "  return MUX_MAP[slug]?.find((e) => e.episode === episode);",
    "}",
    "",
    "export function getRandomPlayback():",
    "  | { slug: string; episode: number; playbackId: string }",
    "  | undefined {",
    "  const slugs = Object.keys(MUX_MAP);",
    "  if (slugs.length === 0) return undefined;",
    "  const slug = slugs[Math.floor(Math.random() * slugs.length)];",
    "  const eps = MUX_MAP[slug];",
    "  const ep = eps[Math.floor(Math.random() * eps.length)];",
    "  return { slug, episode: ep.episode, playbackId: ep.playbackId };",
    "}",
]
open(os.path.join(OUT, "mux-map.new.ts"), "w").write("\n".join(lines) + "\n")

# ---- report ----
rep = ["# Regenerated mux-map report", "",
       f"- slugs: {len(new_map)}   assigned via Dropbox: {len(used_folders)}   preserved: {len(PRESERVE & set(new_map))}",
       f"- warnings: {len(warnings)}", ""]
if warnings:
    rep += ["## WARNINGS"] + [f"- {w}" for w in warnings] + [""]
rep += ["| slug | real show (dropbox) | match% | new #eps | old #eps | folder |",
        "|---|---|---|---|---|---|"]
for si in CAT:
    slug = si["slug"]
    if slug not in new_map: continue
    if slug in PRESERVE:
        rep.append(f"| {slug} | *(preserved: {si['title']})* | - | {len(new_map[slug])} | {len(cur_map.get(slug,[]))} | - |")
        continue
    k = slug_show.get(slug); f = assign.get(k)
    pct = round(100 * score.get((k, f), 0) / max(1, len(shows.get(k, {})))) if f else 0
    rep.append(f"| {slug} | {show_disp.get(k,'?')} | {pct}% | {len(new_map[slug])} | {len(cur_map.get(slug,[]))} | {(f or '')[:8]} |")
open(os.path.join(OUT, "regen-report.md"), "w").write("\n".join(rep) + "\n")

# ---- console summary ----
print(f"shows(uniq)={len(uniq_shows)} folders={len(folders)} assigned={len(assign)}")
print(f"warnings={len(warnings)}")
for w in warnings: print("  !", w)
weak = [(si['slug'], round(100*score.get((slug_show.get(si['slug']), assign.get(slug_show.get(si['slug']))),0)/max(1,len(shows.get(slug_show.get(si['slug']),{})))) )
        for si in CAT if si['slug'] not in PRESERVE and slug_show.get(si['slug']) in assign]
weak = [w for w in weak if w[1] < 90]
print("weak (<90%):", weak)
# count sanity: new vs old episode totals
tot_new = sum(len(v) for v in new_map.values())
print(f"total episodes: new={tot_new}")
