"""Test 1: compare satellite change candidates with registered dump sites.

For each registry site in sites.local.json, read the before/after Sentinel-2 scenes,
run two change rules and report how far each detected patch is from the registry point.

  old rule    : vegetation -> bare (NDVI before > 0.45, NDVI after < 0.15, BSI +0.15)
  bright rule : surface got much brighter and is bare now (catches white piles that
                grow on land that was already bare, which the old rule misses)

Writes one before | after | after+outline image per site into out/.
usage: python registry_check.py [half_deg=0.012]
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from rasterio.warp import transform as wt
from scipy import ndimage

import common as C

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")


def rules(b, a):
    bad = np.isin(b["scl"], C.BAD_SCL) | np.isin(a["scl"], C.BAD_SCL)
    nb, na = C.ndvi(b), C.ndvi(a)
    old = (nb > 0.45) & (na < 0.15) & ((C.bsi(a) - C.bsi(b)) > 0.15)
    # thresholds set by eye from one scene pair, not tuned
    bright = ((C.visible(a) - C.visible(b)) > 800) & (C.visible(a) > 2000) & (na < 0.2)
    return C.clean_mask(old, bad), C.clean_mask(bright, bad)


def patches(mask, col, row, px=10):
    lab, n = ndimage.label(mask)
    res = []
    for i in range(1, n + 1):
        m = lab == i
        yy, xx = np.nonzero(m)
        res.append(dict(ha=round(m.sum() * px * px / 1e4, 2),
                        d_edge_m=round(float(np.min(np.hypot(xx - col, yy - row))) * px)))
    return sorted(res, key=lambda r: r["d_edge_m"])


def main():
    half = float(sys.argv[1]) if len(sys.argv) > 1 else 0.012
    cfg = C.load_sites()
    items = {k: C.s2_item(v) for k, v in cfg["scenes"].items()}
    os.makedirs(OUT, exist_ok=True)
    report = []
    for s in cfg["registry_sites"]:
        bbox = C.bbox_around(s["lat"], s["lon"], half)
        b, tr, crs = C.s2_bands(items["before"], bbox)
        a, _, _ = C.s2_bands(items["after"], bbox)
        old, bright = rules(b, a)
        x, y = wt("EPSG:4326", crs, [s["lon"]], [s["lat"]])
        col, row = ~tr * (x[0], y[0])
        r_eq = math.sqrt(s["rai"] * 1600 / math.pi) if s.get("rai") else None
        report.append(dict(site=s["key"], name=s["name"], registered_rai=s.get("rai"),
                           equiv_radius_m=round(r_eq) if r_eq else None,
                           old_rule=patches(old, col, row)[:6], bright_rule=patches(bright, col, row)[:6]))
        tiles = []
        for label, x_ in (("before", b), ("after", a), ("outline", a)):
            rgb = np.clip(np.dstack([x_["red"], x_["green"], x_["blue"]]) / 3000 * 255, 0, 255).astype(np.uint8)
            if label == "outline":
                for m, color in ((old, (255, 0, 255)), (bright, (0, 255, 255))):
                    rgb[m ^ ndimage.binary_erosion(m)] = color
            im = Image.fromarray(rgb).resize((rgb.shape[1] * 3, rgb.shape[0] * 3), Image.NEAREST)
            d = ImageDraw.Draw(im)
            d.ellipse([col * 3 - 7, row * 3 - 7, col * 3 + 7, row * 3 + 7], outline=(255, 255, 0), width=3)
            if r_eq:
                rr = r_eq / 10 * 3
                d.ellipse([col * 3 - rr, row * 3 - rr, col * 3 + rr, row * 3 + rr], outline=(0, 255, 255), width=2)
            d.rectangle([0, 0, 110, 22], fill=(0, 0, 0))
            d.text((5, 5), label, fill=(255, 255, 255))
            tiles.append(im)
        sheet = Image.new("RGB", (sum(t.width for t in tiles) + 20, tiles[0].height), "white")
        xoff = 0
        for t in tiles:
            sheet.paste(t, (xoff, 0))
            xoff += t.width + 10
        sheet.save(os.path.join(OUT, f"registry_{s['key']}.jpg"), quality=85)
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
