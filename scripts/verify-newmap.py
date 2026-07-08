#!/usr/bin/env python3
"""Integrity check on scripts/out/mux-map.new.ts vs current lib/mux-map.ts."""
import re, os, json
from collections import defaultdict, Counter
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
new=open(os.path.join(ROOT,"scripts","out","mux-map.new.ts")).read()
cur=open(os.path.join(ROOT,"lib","mux-map.ts")).read()
def parse(src):
    d={}
    for blk in re.finditer(r'"([a-z0-9-]+)":\s*\[([\s\S]*?)\]',src):
        eps=re.findall(r'episode:\s*(\d+),\s*playbackId:\s*"([^"]+)"',blk.group(2))
        d[blk.group(1)]=[(int(e),p) for e,p in eps]
    return d
N=parse(new);C=parse(cur)
print(f"slugs: new={len(N)} cur={len(C)}")
missing_slugs=set(C)-set(N); extra=set(N)-set(C)
print(f"slugs only in cur: {missing_slugs or 'none'}")
print(f"slugs only in new: {extra or 'none'}")
# contiguity
bad=[]
for s,eps in N.items():
    nums=[e for e,_ in eps]
    if nums!=list(range(1,len(nums)+1)): bad.append((s,nums[:5]))
print(f"non-contiguous episode numbering: {bad or 'none'}")
# duplicate playbackId across slugs
pid_slugs=defaultdict(set)
for s,eps in N.items():
    for _,p in eps: pid_slugs[p].add(s)
dups={p:sl for p,sl in pid_slugs.items() if len(sl)>1}
print(f"\nplaybackIds shared across >1 slug: {len(dups)}")
slugpair=Counter()
for p,sl in dups.items(): slugpair[tuple(sorted(sl))]+=1
for pair,n in slugpair.most_common(20):
    print(f"   {n:3}  {' & '.join(pair)}")
# per-slug counts new vs cur
print("\nslug episode-count change (new vs cur), |delta|>=5:")
for s in sorted(N):
    dn,dc=len(N[s]),len(C.get(s,[]))
    if abs(dn-dc)>=5: print(f"   {s:44} {dc:3} -> {dn:3}")
