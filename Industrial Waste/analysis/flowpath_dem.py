"""Test 2b: steepest-descent flow path from the landfill on Copernicus DEM 30 m.

Result in the flood case: the path wanders and stops after ~0.2 m of drop, because the
floodplain is flatter than the DEM's own error. Kept so the team can try other sites
(it should work where the terrain actually slopes).
usage: python flowpath_dem.py
"""
import json

import numpy as np
import planetary_computer as pc
import rasterio
from pystac_client import Client
from rasterio.merge import merge
from scipy import ndimage

import common as C


def main():
    cfg = C.load_sites()
    bb = tuple(cfg["flood_region"])
    lf = cfg["landfill"]
    cat = Client.open(C.PLANETARY, modifier=pc.sign_inplace)
    srcs = [rasterio.open(i.assets["data"].href) for i in cat.search(collections=["cop-dem-glo-30"], bbox=bb).items()]
    dem, tr = merge(srcs, bounds=bb)
    dem = ndimage.uniform_filter(dem[0].astype(float), 5)
    c0, r0 = (int(v) for v in ~tr * (lf["lon"], lf["lat"]))
    print("elevation at landfill (m):", round(float(dem[r0, c0]), 1))
    print("region p5 / p50 / p95 (m):", np.percentile(dem, [5, 50, 95]).round(1).tolist())
    path, seen = [(r0, c0)], {(r0, c0)}
    while len(path) < 500:
        r, c = path[-1]
        nbrs = [(r + dy, c + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                if (dy or dx) and (r + dy, c + dx) not in seen
                and 0 <= r + dy < dem.shape[0] and 0 <= c + dx < dem.shape[1]]
        if not nbrs:
            break
        nxt = min(nbrs, key=lambda n: dem[n])
        if dem[nxt] > dem[r, c] + 0.05:
            break
        path.append(nxt)
        seen.add(nxt)
    end = path[-1]
    straight_m = float(np.hypot(end[0] - r0, end[1] - c0)) * 30
    print(f"path steps: {len(path)}, straight-line distance start->end: {straight_m:.0f} m, "
          f"drop: {dem[r0, c0] - dem[end]:.2f} m")
    print(json.dumps([[round(float(v), 5) for v in (tr * (c + .5, r + .5))[::-1]] for r, c in path[::20]]))


if __name__ == "__main__":
    main()
