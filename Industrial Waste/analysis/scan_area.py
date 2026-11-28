"""Step 1 over a whole area: find candidate dump sites from two Sentinel-2 scenes.

Same rules as registry_check.py, run over a bounding box instead of around known sites:
  old rule    : vegetation -> bare (NDVI before > 0.45, NDVI after < 0.15, BSI +0.15)
  bright rule : much brighter and bare now (visible +0.08, visible > 0.20, NDVI after < 0.2)
Cloud / shadow / no-data pixels are removed with the SCL layer of both dates, then one
binary opening, then patches smaller than 50 pixels (0.5 ha) are dropped.

Book round 1 (Jan 2025 -> Jan 2026, same season) used the old rule only and found 41 patches.
Use scenes from the same season; wet-season pairs flag flooded rice fields (round 2: 221).

Outputs (in out/, git-ignored because it contains coordinates):
  candidates_<before>_<after>.csv : rule, area_ha, lat, lon, plus distance to nearest PCD dump
                                     site if data/pcd_sites.json exists (run fetch_registries.py)
  overview_<before>_<after>.jpg   : after-image with magenta = old rule, cyan = bright rule
usage: python scan_area.py BEFORE_ID AFTER_ID [lon0,lat0,lon1,lat1]
  default: S2A_47PQR_20250115_0_L2A S2A_47PQR_20260112_0_L2A 101.40,13.85,101.80,14.10
"""
import csv
import json
import math
import os
import sys

import numpy as np
from PIL import Image
from rasterio.warp import transform as wt
from scipy import ndimage

import common as C
from registry_check import rules

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")


def km(lat1, lon1, lat2, lon2):
    p = math.radians
    a = math.sin(p(lat2 - lat1) / 2) ** 2 + math.cos(p(lat1)) * math.cos(p(lat2)) * math.sin(p(lon2 - lon1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(a))


def load_pcd():
    path = os.path.join(HERE, "data", "pcd_sites.json")
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [(s["lat_f"], s["lng_f"], s["name"]) for s in json.load(f) if s.get("lat_f") and s.get("lng_f")]


def main():
    before = sys.argv[1] if len(sys.argv) > 1 else "S2A_47PQR_20250115_0_L2A"
    after = sys.argv[2] if len(sys.argv) > 2 else "S2A_47PQR_20260112_0_L2A"
    bbox = tuple(map(float, sys.argv[3].split(","))) if len(sys.argv) > 3 else (101.40, 13.85, 101.80, 14.10)
    b, tr, crs = C.s2_bands(C.s2_item(before), bbox)
    a, _, _ = C.s2_bands(C.s2_item(after), bbox)
    bad = np.isin(b["scl"], C.BAD_SCL) | np.isin(a["scl"], C.BAD_SCL)
    old, bright = rules(b, a)
    pcd = load_pcd()
    rows = []
    for name, mask in (("old", old), ("bright", bright)):
        lab, n = ndimage.label(mask)
        for i in range(1, n + 1):
            m = lab == i
            cy, cx = ndimage.center_of_mass(m)
            x, y = tr * (cx + 0.5, cy + 0.5)
            lon, lat = wt(crs, "EPSG:4326", [x], [y])
            row = dict(rule=name, area_ha=round(m.sum() / 100, 2), lat=round(lat[0], 5), lon=round(lon[0], 5))
            if pcd:
                d, nm = min((km(row["lat"], row["lon"], p[0], p[1]), p[2]) for p in pcd)
                row.update(nearest_pcd_km=round(d, 2), nearest_pcd=nm)
            rows.append(row)
    rows.sort(key=lambda r: (r["rule"], -r["area_ha"]))
    os.makedirs(OUT, exist_ok=True)
    tag = f"{before[10:18]}_{after[10:18]}"
    with open(os.path.join(OUT, f"candidates_{tag}.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else ["rule"])
        w.writeheader()
        w.writerows(rows)
    rgb = np.clip(np.dstack([a["red"], a["green"], a["blue"]]) / 3000 * 255, 0, 255).astype(np.uint8)
    for m, color in ((old, (255, 0, 255)), (bright, (0, 255, 255))):
        rgb[ndimage.binary_dilation(m) ^ m] = color
    Image.fromarray(rgb).save(os.path.join(OUT, f"overview_{tag}.jpg"), quality=80)
    area_km2 = (~bad).sum() / 1e4
    for name in ("old", "bright"):
        sel = [r for r in rows if r["rule"] == name]
        print(f"{name:6s}: {len(sel)} patches, {sum(r['area_ha'] for r in sel):.0f} ha")
    print(f"valid pixels: {100 * (~bad).mean():.2f}% of the box ({area_km2:.0f} km2)")
    if pcd:
        near = [r for r in rows if r["nearest_pcd_km"] <= 1.0]
        print(f"patches within 1 km of a PCD dump site: {len(near)}")
    print(f"-> out/candidates_{tag}.csv, out/overview_{tag}.jpg")


if __name__ == "__main__":
    main()
