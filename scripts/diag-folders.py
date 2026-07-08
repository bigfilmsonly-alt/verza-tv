#!/usr/bin/env python3
"""For EVERY Mux folder: its best-matching Dropbox show (over ALL 131 shows,
merged by normalized name) and overlap%. Reveals orphan folders (Mux has a video
set that fingerprints no Dropbox show well) vs clean folders. Read-only."""
import json, os, re, unicodedata
from collections import defaultdict
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=os.path.join(ROOT,"scripts","out")
media=json.load(open(os.path.join(OUT,"dropbox-media.json")))
assets=json.load(open(os.path.join(OUT,"mux-assets.json")))
place=json.load(open(os.path.join(OUT,"placement.json")))
mdur={a["playback_id"]:a["duration"] for a in assets}
def norm(x):
    x=unicodedata.normalize("NFKD",x).encode("ascii","ignore").decode().lower().replace("part","").replace("season","s")
    return re.sub(r"[^a-z0-9]","",x)
def epnum(n):
    for p in (r"\((\d+)\)",r"[Ee][Pp]\.?\s*_?(\d+)",r"(?:^|[^0-9])(\d{1,3})(?=\.[A-Za-z0-9]+$)"):
        m=re.search(p,n)
        if m:return int(m.group(1))
    return None
BUNDLE=re.compile(r"(catalogue|^\d+\s*dramas|verzatv|panel|head\s*shots?|^\d+\s*complete works|^complete works|the 9 new dramas|30 dramas)",re.I)
VERSION=re.compile(r"^(subtitled|subbed|sub|subtitle|clean.*|.*&\s*srt|srt.*|final|成品|posters?|te ?mp4|.*no ?subtitle.*|.*srt$|burned)$",re.I)
def sk(path):
    segs=[s for s in path.split("/")[1:-1] if s!="Verza TV Team Folder"]
    while segs and VERSION.match(segs[-1].strip()):segs.pop()
    segs=[s for s in segs if not BUNDLE.search(s.strip())]
    return (norm(segs[-1]),segs[-1]) if segs else (None,None)
se=defaultdict(lambda:defaultdict(list));disp={}
for m in media:
    d=m.get("duration")
    if not d or d<=0:continue
    e=epnum(m["name"])
    if e is None:continue
    k,l=sk(m["path"])
    if not k:continue
    se[k][e].append(round(d));disp.setdefault(k,l)
def md(v):v=sorted(v);n=len(v);return v[n//2] if n%2 else (v[n//2-1]+v[n//2])/2
shows={k:{e:md(v) for e,v in ep.items()} for k,ep in se.items()}
fe=defaultdict(dict)
for p,dur in mdur.items():
    f=place.get(p,{}).get("folder")
    if f:fe[f][p]=dur
def ov(a,b,t=1):
    bb=sorted(b);u=[False]*len(bb);c=0
    for x in sorted(a):
        for i,y in enumerate(bb):
            if not u[i] and abs(x-y)<=t:u[i]=True;c+=1;break
    return c
rows=[]
for f,d in fe.items():
    durs=list(d.values())
    best=sorted(((ov(durs,list(s.values())),len(s),k) for k,s in shows.items()),reverse=True)
    b0=best[0];b1=best[1]
    rows.append((round(100*b0[0]/max(1,len(durs))),len(durs),f[:8],disp.get(b0[2]),b0[0],
                 disp.get(b1[2]),round(100*b1[0]/max(1,len(durs)))))
rows.sort()
print("bestcov% assets folder  -> best show (overlap)  | 2nd best")
for pct,n,f,name,o,n2,p2 in rows:
    print(f"  {pct:3}%  {n:3}  {f}  {str(name)[:38]:38} ({o})  | {str(n2)[:24]:24} {p2}%")
