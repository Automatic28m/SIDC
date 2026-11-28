"""True-colour crops of the landfill for several Sentinel-2 dates, with sample points.

usage: python rgb_timeline.py SCENE_ID [SCENE_ID ...]
  e.g. S2A_47PQR_20260112_0_L2A S2C_47PQR_20261007_0_L2A S2C_47PQR_20261017_0_L2A S2B_47PQR_20261121_0_L2A
Clear scenes for tile 47PQR, Sep-Nov 2026: 20261007, 20261017, 20261022, 20261121 (cloud <= 21%).
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from rasterio.warp import transform as wt

import common as C

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")


def main():
    cfg = C.load_sites()
    lf = cfg["landfill"]
    bbox = C.bbox_around(lf["lat"], lf["lon"], 0.015)
    os.makedirs(OUT, exist_ok=True)
    for sid in sys.argv[1:]:
        it = C.s2_item(sid)
        a, tr, crs = C.read_window(it.assets["visual"].href, bbox, bands=[1, 2, 3])
        im = Image.fromarray(np.clip(np.moveaxis(a, 0, 2) * 1.5, 0, 255).astype(np.uint8))
        im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        for p in cfg.get("sample_points", []):
            x, y = wt("EPSG:4326", crs, [p["lon"]], [p["lat"]])
            c, r = ~tr * (x[0], y[0])
            c, r = c * 2, r * 2
            d.ellipse([c - 8, r - 8, c + 8, r + 8], outline=(255, 0, 0), width=3)
            d.text((c + 10, r - 8), p["name"], fill=(255, 60, 60))
        d.text((6, 6), sid, fill=(255, 255, 0))
        im.save(os.path.join(OUT, f"rgb_{sid}.jpg"), quality=85)
        print("saved", sid)


if __name__ == "__main__":
    main()
