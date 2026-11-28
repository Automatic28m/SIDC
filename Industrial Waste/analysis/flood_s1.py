"""Test 2a: flood extent around a landfill from Sentinel-1 radar (sees through cloud).

Uses Microsoft Planetary Computer `sentinel-1-rtc` (free, no key; URLs are signed
automatically). One orbit track only, so every date is comparable.
Water = VV backscatter < -18 dB. Flood = water now but not in the dry-season median.

Prints, per date: flooded km2 in the region and % flooded within 1 km of the landfill.
Writes out/flood_<date>.png (blue = flood, dark blue = permanent water).
usage: python flood_s1.py [track_hint=T2308] [orbit=descending]
"""
import json
import os
import sys

import numpy as np
import planetary_computer as pc
from PIL import Image, ImageDraw
from pystac_client import Client
from rasterio.warp import Resampling, reproject, transform as wt

import common as C

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
WATER_DB = -18.0  # generic threshold, not tuned for this area


def main():
    track = sys.argv[1] if len(sys.argv) > 1 else "T2308"
    orbit = sys.argv[2] if len(sys.argv) > 2 else "descending"
    cfg = C.load_sites()
    bb = tuple(cfg["flood_region"])
    lf = cfg["landfill"]
    cat = Client.open(C.PLANETARY, modifier=pc.sign_inplace)
    items = [i for i in cat.search(collections=["sentinel-1-rtc"], bbox=bb,
                                   datetime="2026-01-01/2026-11-30").items()
             if i.properties.get("sat:orbit_state") == orbit and track in i.id]
    items.sort(key=lambda i: i.datetime)
    ref = None
    db = {}
    for it in items:
        a, tr, crs = C.read_window(it.assets["vv"].href, bb)
        a = a.astype("float32")
        if ref is None:
            ref = (tr, crs, a.shape)
        elif (tr, crs, a.shape) != ref:
            dst = np.zeros(ref[2], "float32")
            reproject(a, dst, src_transform=tr, src_crs=crs, dst_transform=ref[0],
                      dst_crs=ref[1], resampling=Resampling.bilinear)
            a = dst
        db[it.datetime.strftime("%Y%m%d")] = 10 * np.log10(np.maximum(a, 1e-5))
    dry_dates = [k for k in db if k[4:6] in ("01", "02", "03")]
    dry = np.median([db[k] for k in dry_dates], axis=0)
    perm = dry < WATER_DB
    tr, crs, shape = ref
    x, y = wt("EPSG:4326", crs, [lf["lon"]], [lf["lat"]])
    col, row = (int(v) for v in ~tr * (x[0], y[0]))
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    ring = np.hypot(yy - row, xx - col) <= 100  # 1 km at 10 m
    os.makedirs(OUT, exist_ok=True)
    stats = {}
    for k, d in db.items():
        if k[4:6] < "08":
            continue
        flood = (d < WATER_DB) & ~perm
        stats[k] = dict(flood_km2=round(flood.sum() * 100 / 1e6, 1),
                        flood_pct_1km=round(100 * float(flood[ring].mean())))
        v = np.clip((d + 25) / 20 * 255, 0, 255).astype(np.uint8)
        rgb = np.dstack([v, v, v])
        rgb[flood] = (30, 120, 255)
        rgb[perm & (d < WATER_DB)] = (10, 40, 110)
        im = Image.fromarray(rgb)
        dr = ImageDraw.Draw(im)
        dr.ellipse([col - 100, row - 100, col + 100, row + 100], outline=(255, 210, 0), width=2)
        dr.text((6, 6), f"{k}  flood {stats[k]['flood_km2']} km2, 1 km ring {stats[k]['flood_pct_1km']}%",
                fill=(255, 255, 0))
        im.save(os.path.join(OUT, f"flood_{k}.png"))
    print("dry reference dates:", dry_dates)
    print(json.dumps(stats, indent=1))


if __name__ == "__main__":
    main()
