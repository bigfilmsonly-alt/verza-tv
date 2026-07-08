#!/usr/bin/env python3
"""
Index the Dropbox "Verza TV Team Folder" source-of-truth videos.

For every SHOW folder it finds the ordered episode files (handling the three
naming styles: "EP (N).mp4", "NN.mp4", "..._EpNN.mp4") and nested version
subfolders (subtitled / clean&srt / cleanversion). It reads each file's exact
video duration straight from the MP4 'mvhd' atom (no ffmpeg needed) so we can
later fingerprint-match each Dropbox show to the correct Mux source folder.

Writes: scripts/out/dropbox-durations.json
        { "<show folder name>": [[episode, duration_seconds], ...], ... }
"""
import os, re, json, struct, sys

DBX = "/Users/jothamhall/Library/CloudStorage/Dropbox/Verza TV Team Folder"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts", "out")
CACHE = os.path.join(OUT, "dropbox-durations.json")

# Top-level entries that are NOT single-show episode folders.
SKIP = re.compile(r"(catalogue|srt files|head\s*shots|panel|posters?$|^\d+ dramas|verzatv new|^\d+ dramas srt)", re.I)

def epnum(name):
    """Pull the episode number out of a filename."""
    m = re.search(r"\((\d+)\)", name)                 # EP (12).mp4
    if m: return int(m.group(1))
    m = re.search(r"[Ee][Pp]\.?\s*_?(\d+)", name)     # ..._Ep07 / EP07
    if m: return int(m.group(1))
    m = re.search(r"(?:^|[^0-9])(\d{1,3})(?=\.[A-Za-z0-9]+$)", name)  # 01.mp4
    if m: return int(m.group(1))
    return None

def mvhd_dur(path):
    """Exact duration (s) from the MP4 movie header. moov may sit at head or tail."""
    try:
        sz = os.path.getsize(path)
        with open(path, "rb") as f:
            head = f.read(2 * 1024 * 1024)
            i = head.find(b"mvhd")
            data, p = head, i
            if i < 0:
                f.seek(max(0, sz - 8 * 1024 * 1024))
                tail = f.read()
                j = tail.find(b"mvhd")
                if j < 0: return None
                data, p = tail, j
        p += 4
        ver = data[p]
        if ver == 0:
            ts = struct.unpack(">I", data[p+12:p+16])[0]
            du = struct.unpack(">I", data[p+16:p+20])[0]
        else:
            ts = struct.unpack(">I", data[p+20:p+24])[0]
            du = struct.unpack(">Q", data[p+24:p+32])[0]
        return du / ts if ts else None
    except Exception:
        return None

def pick_episode_files(show_dir):
    """Return {episode: filepath} choosing ONE version per episode."""
    # 1) flat EP files directly in the show folder
    flat = {}
    for fn in os.listdir(show_dir):
        full = os.path.join(show_dir, fn)
        if os.path.isfile(full) and fn.lower().endswith((".mp4", ".mov")):
            e = epnum(fn)
            if e is not None: flat[e] = full
    if len(flat) >= 3:
        return flat
    # 2) otherwise prefer a version subfolder
    subs = [d for d in os.listdir(show_dir) if os.path.isdir(os.path.join(show_dir, d))]
    order = ["subtitled", "subbed", "cleanversion", "clean", "final", "成品"]
    subs.sort(key=lambda d: next((i for i, k in enumerate(order) if k in d.lower()), 99))
    for d in subs:
        if "poster" in d.lower(): continue
        sd = os.path.join(show_dir, d)
        got = {}
        for fn in os.listdir(sd):
            full = os.path.join(sd, fn)
            if os.path.isfile(full) and fn.lower().endswith((".mp4", ".mov")):
                e = epnum(fn)
                if e is not None: got[e] = full
        if len(got) >= 3:
            return got
    return flat

cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
shows = [d for d in sorted(os.listdir(DBX))
         if os.path.isdir(os.path.join(DBX, d)) and not SKIP.search(d)
         and not d.startswith(".") and d not in ("Camera Uploads", "Mobile Uploads")]

for si, show in enumerate(shows):
    if show in cache:
        continue
    files = pick_episode_files(os.path.join(DBX, show))
    rows = []
    for e in sorted(files):
        d = mvhd_dur(files[e])
        if d: rows.append([e, round(d)])
    cache[show] = rows
    json.dump(cache, open(CACHE, "w"))
    print(f"[{si+1}/{len(shows)}] {show}: {len(rows)} eps", flush=True)

print(f"\nDONE. {len(cache)} shows indexed -> {CACHE}")
