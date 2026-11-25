// Builds lib/data/pcd.json from the spike CSVs (PCD Kok River results + Sentinel-2 matches).
// Usage: node scripts/build-pcd-data.mjs
import { readFileSync, writeFileSync } from "node:fs";

const SPIKE = new URL("../../spike/", import.meta.url);

function parseCsv(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",");
  return lines.map((l) => {
    const v = l.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, v[i] ?? ""]));
  });
}

const pcd = parseCsv(readFileSync(new URL("kok_turbidity_arsenic.csv", SPIKE), "utf8"));
const s2 = parseCsv(readFileSync(new URL("kok_satellite_vs_pcd.csv", SPIKE), "utf8"));

const stations = {};
for (const r of pcd) {
  const s = (stations[r.station] ??= { id: r.station, history: [], satellite: [] });
  s.history.push({
    date: r.date,
    arsenic: r.arsenic_mg_l === "" ? null : Number(r.arsenic_mg_l),
    turbidity: r.turbidity_ntu === "" ? null : Number(r.turbidity_ntu),
  });
}
for (const r of s2) {
  if (!r.s2_ndti || !stations[r.station]) continue;
  stations[r.station].satellite.push({ date: r.s2_date, ndti: Number(Number(r.s2_ndti).toFixed(4)) });
}

const arsenicDates = [...new Set(pcd.filter((r) => r.arsenic_mg_l !== "").map((r) => r.date))].sort();
const out = {
  source: "spike/kok_turbidity_arsenic.csv + spike/kok_satellite_vs_pcd.csv",
  latestArsenicRound: arsenicDates.at(-1),
  rounds: [...new Set(pcd.map((r) => r.date))].sort(),
  stations: Object.values(stations).sort((a, b) => a.id.localeCompare(b.id)),
};
writeFileSync(new URL("../lib/data/pcd.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("stations", out.stations.length, "latest arsenic round", out.latestArsenicRound);
