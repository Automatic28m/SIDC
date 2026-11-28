"""Shared helpers: load site config, read Sentinel-2 / Sentinel-1 windows."""
import json
import os
import sys

import numpy as np
import rasterio
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds

os.environ.setdefault("AWS_NO_SIGN_REQUEST", "YES")
os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")

EARTH_SEARCH = "https://earth-search.aws.element84.com/v1"
PLANETARY = "https://planetarycomputer.microsoft.com/api/stac/v1"
BAD_SCL = [0, 1, 3, 8, 9, 10]  # no data, saturated, cloud shadow, cloud medium/high, cirrus


def load_sites(path=None):
    """Read sites.local.json (not in git). Falls back to sites.example.json."""
    here = os.path.dirname(os.path.abspath(__file__))
    path = path or os.path.join(here, "sites.local.json")
    if not os.path.exists(path):
        print(f"{path} not found, using sites.example.json (placeholder values)", file=sys.stderr)
        path = os.path.join(here, "sites.example.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def bbox_around(lat, lon, half_deg):
    return (lon - half_deg, lat - half_deg, lon + half_deg, lat + half_deg)


def s2_item(scene_id):
    from pystac_client import Client
    cat = Client.open(EARTH_SEARCH)
    return next(cat.search(collections=["sentinel-2-l2a"], ids=[scene_id]).items())


def read_window(href, bbox, out_shape=None, bands=1):
    """Read a lon/lat bbox from a COG. Returns (array, transform, crs)."""
    with rasterio.open(href) as src:
        win = from_bounds(*transform_bounds("EPSG:4326", src.crs, *bbox), src.transform)
        kw = dict(window=win, boundless=True, fill_value=0)
        if out_shape is not None:
            kw["out_shape"] = out_shape
        arr = src.read(bands, **kw)
        return arr, src.window_transform(win), src.crs


def s2_bands(item, bbox, names=("blue", "green", "red", "nir", "swir16", "scl")):
    """All bands resampled onto the 10 m red-band grid."""
    red, tr, crs = read_window(item.assets["red"].href, bbox)
    out = {"red": red.astype(float)}
    for b in names:
        if b == "red":
            continue
        out[b] = read_window(item.assets[b].href, bbox, out_shape=red.shape)[0].astype(float)
    return out, tr, crs


def ndvi(x):
    return (x["nir"] - x["red"]) / (x["nir"] + x["red"] + 1e-9)


def bsi(x):
    a = x["swir16"] + x["red"]
    b = x["nir"] + x["blue"]
    return (a - b) / (a + b + 1e-9)


def visible(x):
    return (x["blue"] + x["green"] + x["red"]) / 3


def clean_mask(mask, bad, min_px=50):
    from scipy import ndimage
    m = ndimage.binary_opening(mask & ~bad)
    lab, n = ndimage.label(m)
    if n == 0:
        return m
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    return np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= min_px])
