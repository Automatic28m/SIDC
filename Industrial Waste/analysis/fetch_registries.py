"""Download the two public registries into data/ (git-ignored).

1. PCD municipal solid-waste disposal sites (thaimsw.pcd.go.th): the map page embeds
   every site as URL-encoded JSON (id, name, lat, lng, year).
2. DIW licensed waste-management factories, types 101/105/106 (diw-dataset.diw.go.th):
   a CSV with addresses only, no coordinates.

usage: python fetch_registries.py [province_th]   (default ปราจีนบุรี)
"""
import csv
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
PCD_URL = "https://thaimsw.pcd.go.th/report_map.php"
DIW_URL = ("https://diw-dataset.diw.go.th/dataset/2271d6e9-cac4-4473-bf2b-e948b4ea2d36/"
           "resource/9293297a-0e6f-45d4-847d-4c5cb3bf9abf/download/factype101-105-106.csv")
UA = {"User-Agent": "research-script/1.0"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()


def to_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def fetch_pcd():
    html = get(PCD_URL).decode("utf-8", "replace")
    m = re.search(r"\('(%5B%7B[^']+)'\)", html)
    if not m:
        raise SystemExit("PCD page layout changed: embedded site list not found")
    sites = json.loads(urllib.parse.unquote(m.group(1)))
    for s in sites:
        s["name"] = s["name"].replace("+", " ")
        s["lat_f"], s["lng_f"] = to_float(s["lat"]), to_float(s["lng"])
    bad = sum(1 for s in sites if s["lat_f"] is None or s["lng_f"] is None)
    with open(os.path.join(DATA, "pcd_sites.json"), "w", encoding="utf-8") as f:
        json.dump(sites, f, ensure_ascii=False)
    print(f"PCD: {len(sites)} sites, {bad} with unparseable coordinates -> data/pcd_sites.json")


def fetch_diw(province):
    raw = get(DIW_URL).decode("utf-8-sig", "replace")
    rows = list(csv.DictReader(io.StringIO(raw)))
    prov_col = next(k for k in rows[0] if "จังหวัด" in k or "prov" in k.lower())
    keep = [r for r in rows if province in (r.get(prov_col) or "")]
    out = os.path.join(DATA, "diw_101_105_106.csv")
    with open(out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(keep)
    print(f"DIW: {len(rows)} licences nationwide, {len(keep)} in {province} -> data/diw_101_105_106.csv")
    print("     columns:", ", ".join(rows[0].keys()))


if __name__ == "__main__":
    os.makedirs(DATA, exist_ok=True)
    fetch_pcd()
    fetch_diw(sys.argv[1] if len(sys.argv) > 1 else "ปราจีนบุรี")
