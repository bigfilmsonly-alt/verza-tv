#!/usr/bin/env python3
"""Probe the weak assignments: for each weak slug, show top folders by overlap,
folder asset counts, and whether the assigned folder is its global best."""
import json, os, re, unicodedata
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "scripts", "out")
media  = json.load(open(os.path.join(OUT, "dropbox-media.json")))
assets = json.load(open(os.path.join(OUT, "mux-assets.json")))
place  = json.load(open(os.path.join(OUT, "placement.json")))
mdur = {a["playback_id"]: a["duration"] for a in assets}

def norm(x):
    x = unicodedata.normalize("NFKD", x).encode("ascii","ignore").decode().lower()
    x = x.replace("part","").replace("season","s")
    return re.sub(r"[^a-z0-9]","",x)
def epnum(name):
    for pat in (r"\((\d+)\)", r"[Ee][Pp]\.?\s*_?(\d+)", r"(?:^|[^0-9])(\d{1,3})(?=\.[A-Za-z0-9]+$)"):
        mm=re.search(pat,name)
        if mm: return int(mm.group(1))
    return None
BUNDLE=re.compile(r"(catalogue|^\d+\s*dramas|verzatv|panel|head\s*shots?|^\d+\s*complete works|^complete works|the 9 new dramas|30 dramas)",re.I)
VERSION=re.compile(r"^(subtitled|subbed|sub|subtitle|clean.*|.*&\s*srt|srt.*|final|成品|posters?|te ?mp4|.*no ?subtitle.*|.*srt$|burned)$",re.I)
def show_key(path):
    segs=[s for s in path.split("/")[1:-1] if s!="Verza TV Team Folder"]
    while segs and VERSION.match(segs[-1].strip()): segs.pop()
    segs=[s for s in segs if not BUNDLE.search(s.strip())]
    if not segs: return None,None
    return norm(segs[-1]), segs[-1]

# ALL dropbox dirs at path level (not merged) so we can see version spread
dir_eps=defaultdict(dict)
for m in media:
    d=m.get("duration")
    if not d or d<=0: continue
    e=epnum(m["name"])
    if e is None: continue
    dirp=m["path"].rsplit("/",1)[0]
    dir_eps[dirp].setdefault(e,round(d))

show_eps=defaultdict(lambda:defaultdict(list)); disp={}
for m in media:
    d=m.get("duration")
    if not d or d<=0: continue
    e=epnum(m["name"])
    if e is None: continue
    k,leaf=show_key(m["path"])
    if not k: continue
    show_eps[k][e].append(round(d)); disp.setdefault(k,leaf)
def med(v): v=sorted(v);n=len(v);return v[n//2] if n%2 else (v[n//2-1]+v[n//2])/2
shows={k:{e:med(v) for e,v in eps.items()} for k,eps in show_eps.items()}

folder_eps=defaultdict(dict)
for p,dur in mdur.items():
    f=place.get(p,{}).get("folder")
    if f: folder_eps[f][p]=dur
def overlap(a,b,tol=1):
    bb=sorted(b);used=[False]*len(bb);c=0
    for x in sorted(a):
        for i,y in enumerate(bb):
            if not used[i] and abs(x-y)<=tol: used[i]=True;c+=1;break
    return c

WEAK={"billionaire-daughters-love-triangle":norm("Billionaire Daughter's Love Triangle"),
 "married-to-my-brothers-ex":norm("Married to my brothers Ex"),
 "tangled-in-desire":norm("Tangled in Desire"),
 "the-escaping-mistress":norm("The Escaping Mistress"),
 "trial-marriage-to-a-billionaire-s2":norm("TRIAL MARRIAGE TO A BILLIONAIRE Season 2"),
 "echo-of-vengeance":norm("Echoes of Vengeance"),
 "the-billionaires-lost-love":norm("The Billionaires Lost Love"),
 "the-ceo":norm("The CEO")}

for slug,k in WEAK.items():
    sd=list(shows.get(k,{}).values())
    print(f"\n=== {slug}  show='{disp.get(k,'?')}' ({len(sd)} eps merged) ===")
    scored=sorted(((overlap(list(fe.values()),sd),len(fe),f) for f,fe in folder_eps.items()),reverse=True)
    for sc,n,f in scored[:4]:
        print(f"   folder {f[:8]}  overlap={sc:3}  assets={n}")
    # also: alternate dropbox version dirs for this show and their ep count
    alts=[(dp,len(e)) for dp,e in dir_eps.items() if norm(show_key(dp+'/x.mp4')[0] or '')==k or k in norm(dp)]
    print("   dropbox dirs for this show:")
    for dp,n in sorted(alts,key=lambda x:-x[1])[:6]:
        print(f"      {n:3}  {dp.replace('/Verza TV Team Folder/','')}")
