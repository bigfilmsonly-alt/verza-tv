#!/usr/bin/env python3
"""
Regenerate the Amazon product cutouts in public/amazon/.

Why this exists: the product cards are BLACK. Amazon shoots every product on a
white studio sweep and bakes that white into the JPEG, so simply colouring the
card black would leave a white slab floating on it — worse than leaving it white.
No CSS blend mode can rescue that, because a white backdrop pixel and a white
product pixel (the eos bottle, the Mighty Patch box) are the very same colour.
The white has to actually come out of the image.

The trick is to remove only the white CONNECTED TO THE BORDER. A naive "make
every white pixel transparent" would punch holes straight through the white
products. Flooding inward from the corners can only ever eat the backdrop.

Shots that are not on a white sweep (lifestyle collages, e.g. the sunset lamp)
are detected and passed through untouched.

Reads the product list straight out of lib/amazon-sponsors.ts, so adding a
product there and re-running is all it takes.

    pip install pillow numpy
    python3 scripts/amazon-cutouts.py
"""

import io
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "lib" / "amazon-sponsors.ts"
OUT = ROOT / "public" / "amazon"

# Must stay in step with CUTOUT_WIDTHS in lib/amazon-sponsors.ts.
WIDTHS = [400, 800, 1200]

WHITE = 238              # this bright in every channel counts as backdrop
BORDER_WHITE_MIN = 0.45  # below this, the shot isn't on a white sweep
MASTER = 1500            # source resolution pulled from Amazon's CDN

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)


def products():
    """Every product in the catalog, as (id, imageId)."""
    src = SOURCE.read_text()
    ids = re.findall(r'^    id: "([^"]+)",$', src, re.M)
    imgs = re.findall(r'^    imageId: "([^"]+)",$', src, re.M)
    if len(ids) != len(imgs):
        sys.exit(
            f"lib/amazon-sponsors.ts has {len(ids)} ids but {len(imgs)} imageIds. "
            "Every product needs both before its cutout can be generated."
        )
    return list(zip(ids, imgs))


def fetch(image_id: str) -> Image.Image:
    url = f"https://m.media-amazon.com/images/I/{image_id}._SL{MASTER}_.jpg"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def cut_out(img: Image.Image):
    """Returns (image, fraction_removed_or_None, border_whiteness)."""
    arr = np.array(img)
    near_white = arr.min(axis=2) >= WHITE

    edges = np.concatenate([
        near_white[0, :], near_white[-1, :], near_white[:, 0], near_white[:, -1],
    ])
    frac = edges.mean()

    # Gate on the CORNERS, not the whole border. A model shot cropped so the body
    # runs off the top and bottom edges is still on a white sweep, and judging it
    # by total border whiteness wrongly rejects it. The corners are what the flood
    # fill seeds from, so they are what decides whether this can work at all.
    corners = [
        near_white[0, 0], near_white[0, -1],
        near_white[-1, 0], near_white[-1, -1],
    ]
    if sum(corners) < 3 or frac < BORDER_WHITE_MIN:
        return img, None, frac

    # .copy() is load-bearing, not tidiness. Image.fromarray hands back an image
    # still backed by the numpy buffer, and floodfill's writes do not survive the
    # trip back out through np.array() — it silently removes nothing and every
    # product keeps its white background. Detaching from the buffer first fixes
    # it. (An explicit .load() does NOT.)
    mask = Image.fromarray(np.where(near_white, 255, 0).astype(np.uint8)).copy()
    h, w = near_white.shape
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if mask.getpixel(seed) == 255:
            ImageDraw.floodfill(mask, seed, 128, thresh=0)
    backdrop = np.array(mask) == 128
    if backdrop.mean() == 0:
        # The gate said white sweep but nothing came out. Better to fail loudly
        # than to quietly ship 12 products with white backgrounds again.
        sys.exit("flood fill removed nothing — the mask is not mutable")

    # Binary alpha, then pull the edge in a pixel. Without that, the product's
    # anti-aliased rim — part product, part white sweep — survives as a bright
    # halo, and a halo is exactly what you notice against black.
    alpha = Image.fromarray(np.where(backdrop, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3))        # erode 1px
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))   # re-soften the cut

    out = img.convert("RGBA")
    out.putalpha(alpha)
    return out, backdrop.mean(), frac


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    items = products()
    print(f"{len(items)} products -> public/amazon/\n")
    print(f"{'product':<38} {'border-white':>12} {'removed':>8}  mode")
    print("-" * 78)

    for pid, image_id in items:
        img, removed, frac = cut_out(fetch(image_id))

        for w in WIDTHS:
            r = img.copy()
            r.thumbnail((w, w), Image.LANCZOS)
            r.save(OUT / f"{pid}-{w}.webp", "WEBP", quality=88, method=6)

        mode = "cutout" if removed is not None else "passthrough (not a white sweep)"
        shown = f"{removed * 100:6.1f}%" if removed is not None else "     --"
        print(f"{pid:<38} {frac * 100:11.1f}% {shown}  {mode}")


if __name__ == "__main__":
    main()
