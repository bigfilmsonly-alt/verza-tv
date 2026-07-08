#!/usr/bin/env python3
"""
Fill exact video durations for every episode file in the Dropbox "Verza TV
Team Folder" using per-file get_metadata (media_info). NO downloads.

Recursive list_folder does NOT populate media_info, but get_metadata does, so
we list once (recursive) to enumerate files, then fetch each file's duration.

Env: DBXTOKEN
Reads/Writes (resumable): scripts/out/dropbox-media.json
    -> [{path, name, duration}]   duration in SECONDS (null until fetched)
"""
import os, json, time, threading, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

TOK = os.environ["DBXTOKEN"]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts", "out")
DEST = os.path.join(OUT, "dropbox-media.json")
ROOT = "/Verza TV Team Folder"

def api(ep, body):
    for attempt in range(8):
        try:
            r = urllib.request.Request(
                "https://api.dropboxapi.com/2/" + ep,
                data=json.dumps(body).encode(),
                headers={"Authorization": "Bearer " + TOK, "Content-Type": "application/json"})
            return json.load(urllib.request.urlopen(r, timeout=60))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(int(e.headers.get("Retry-After", "5")) + 1); continue
            if e.code >= 500:
                time.sleep(2 * (attempt + 1)); continue
            raise
        except Exception:
            time.sleep(1 + attempt); continue
    return None

# --- enumerate (reuse cache if present) ---
if os.path.exists(DEST):
    files = json.load(open(DEST))
else:
    files, res = [], api("files/list_folder",
                         {"path": ROOT, "recursive": True, "limit": 2000})
    while True:
        for e in res["entries"]:
            if e[".tag"] == "file" and e["name"].lower().endswith((".mp4", ".mov", ".m4v")):
                files.append({"path": e["path_display"], "name": e["name"], "duration": None})
        if not res.get("has_more"):
            break
        res = api("files/list_folder/continue", {"cursor": res["cursor"]})
    json.dump(files, open(DEST, "w"))

todo = [f for f in files if f.get("duration") is None]
print(f"{len(files)} files, {len(todo)} to fetch", flush=True)

lock = threading.Lock()
done = [0]
def fetch(f):
    md = api("files/get_metadata", {"path": f["path"], "include_media_info": True})
    dur = None
    if md:
        mi = md.get("media_info")
        if mi and mi.get(".tag") == "metadata":
            m = mi["metadata"]
            if m.get(".tag") == "video" and m.get("duration") is not None:
                dur = m["duration"] / 1000.0
    f["duration"] = dur if dur is not None else -1  # -1 = fetched, no media_info
    with lock:
        done[0] += 1
        if done[0] % 500 == 0:
            print(f"  {done[0]}/{len(todo)}", flush=True)
            json.dump(files, open(DEST, "w"))

with ThreadPoolExecutor(max_workers=16) as ex:
    list(ex.map(fetch, todo))
json.dump(files, open(DEST, "w"))
got = sum(1 for f in files if f["duration"] and f["duration"] > 0)
print(f"\nDONE. {len(files)} files, {got} with duration -> {DEST}")
