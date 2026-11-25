// Approximate river geometry for the mockup. Coordinates are hand-placed, not surveyed.
import pcd from "./data/pcd.json";

export const KOK = [
  [20.04, 99.28], [20.0, 99.34], [19.985, 99.37], [19.965, 99.43], [19.94, 99.5],
  [19.915, 99.57], [19.895, 99.64], [19.9, 99.71], [19.915, 99.78], [19.925, 99.83],
  [19.945, 99.88], [19.99, 99.93], [20.04, 99.98], [20.09, 100.04], [20.14, 100.09],
  [20.215, 100.135],
];

export const SAI_RUAK = [
  [20.44, 99.86], [20.432, 99.885], [20.41, 99.95], [20.38, 100.02], [20.355, 100.082],
];

export const MEKONG = [
  [20.355, 100.082], [20.275, 100.09], [20.215, 100.135], [20.18, 100.25],
  [20.23, 100.33], [20.265, 100.41],
];

export const RIVERS = [
  { id: "kok", name: "แม่น้ำกก", coords: KOK },
  { id: "sai", name: "แม่น้ำสาย–รวก", coords: SAI_RUAK },
  { id: "mekong", name: "แม่น้ำโขง", coords: MEKONG },
];

// Place stations KK01..KK15 at evenly spaced points along the Kok polyline (downstream order).
function cumulative(coords) {
  const d = [0];
  for (let i = 1; i < coords.length; i++) {
    const [a, b] = [coords[i - 1], coords[i]];
    d.push(d[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return d;
}

function pointAt(coords, t) {
  const d = cumulative(coords);
  const target = t * d.at(-1);
  for (let i = 1; i < coords.length; i++) {
    if (d[i] >= target) {
      const f = (target - d[i - 1]) / (d[i] - d[i - 1] || 1);
      const [a, b] = [coords[i - 1], coords[i]];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
  }
  return coords.at(-1);
}

const AREA = [
  "อ.แม่อาย (ท่าตอน)", "อ.แม่อาย", "อ.แม่อาย", "อ.เมืองเชียงราย (ต้นน้ำ)", "อ.เมืองเชียงราย",
  "อ.เมืองเชียงราย", "สะพานข้ามแม่น้ำกก", "อ.เมืองเชียงราย", "อ.เมืองเชียงราย", "ฝายเชียงราย",
  "อ.เมืองเชียงราย (ท้ายน้ำ)", "อ.เวียงชัย", "อ.เชียงแสน", "อ.เชียงแสน", "ปากน้ำกก (บรรจบโขง)",
];

export const STATIONS = pcd.stations.map((s, i) => ({
  ...s,
  area: AREA[i] ?? "",
  position: pointAt(KOK, 0.03 + (0.94 * i) / (pcd.stations.length - 1)),
}));

export const LATEST_ROUND = pcd.latestArsenicRound;
export const ROUNDS = pcd.rounds;

// Mock ThaiWater-style water level stations (values are simulated in the browser).
export const WATER_LEVEL_STATIONS = [
  { id: "WL-KOK-TT", name: "แม่น้ำกก ท่าตอน", position: [19.99, 99.375], base: 2.14, bank: 6.5 },
  { id: "WL-KOK-CR", name: "แม่น้ำกก เชียงราย", position: [19.93, 99.84], base: 1.62, bank: 5.8 },
  { id: "WL-MK-CS", name: "แม่น้ำโขง เชียงแสน", position: [20.275, 100.095], base: 3.05, bank: 11.8 },
];
