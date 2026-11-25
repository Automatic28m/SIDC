// Risk logic shown in the mockup. Mirrors the rules in the RiverSafe plan:
// - arsenic above 0.010 mg/L in the latest round -> high
// - at the standard, or above it in an earlier round -> watch
// - stale data (older than 60 days) raises "low" to "watch"
// - never say "safe"
export const STANDARD = 0.01; // mg/L, surface water / drinking water reference
export const MOCK_NOW = "2026-11-23"; // fixed "today" for the mockup

export const LEVELS = {
  high: { label: "สูง", color: "#c0392b", bg: "#fbe5e2", text: "#8f2b20" },
  watch: { label: "เฝ้าระวัง", color: "#d98a1c", bg: "#fcefd9", text: "#8a4a0c" },
  low: { label: "ต่ำ", color: "#2e8b57", bg: "#e0f1e6", text: "#1f6b35" },
};

export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export function assessStation(station, latestRound) {
  const latest = station.history.find((h) => h.date === latestRound);
  const value = latest?.arsenic ?? null;
  const earlierExceed = station.history.some(
    (h) => h.date < latestRound && h.arsenic !== null && h.arsenic > STANDARD,
  );
  let level;
  let reason;
  if (value !== null && value > STANDARD) {
    level = "high";
    reason = `สารหนู ${value.toFixed(3)} มก./ล. เกินมาตรฐาน ${STANDARD.toFixed(3)} ในรอบล่าสุด`;
  } else if (value !== null) {
    level = "watch";
    reason = `สารหนู ${value.toFixed(3)} มก./ล. เท่ากับเกณฑ์มาตรฐานพอดี`;
  } else if (earlierExceed) {
    level = "watch";
    reason = "รอบล่าสุดไม่รายงานค่าเกิน แต่เคยเกินมาตรฐานในรอบก่อนหน้า";
  } else {
    level = "low";
    reason = "ไม่พบค่าเกินมาตรฐานในชุดข้อมูล";
  }
  const age = daysBetween(latestRound, MOCK_NOW);
  const stale = age > 60;
  if (stale && level === "low") {
    level = "watch";
    reason += ` · ข้อมูลเก่า ${age} วัน จึงปรับขึ้นเป็นเฝ้าระวัง`;
  }
  const lastExceed = [...station.history].reverse().find((h) => h.arsenic !== null);
  return { level, reason, value, age, stale, lastExceed };
}

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function thaiDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${TH_MONTHS[m - 1]} ${y + 543}`;
}

export function ndtiColor(ndti) {
  if (ndti == null) return "#9aa7ad";
  if (ndti < 0.05) return "#3a86c8";
  if (ndti < 0.1) return "#7a9e4a";
  if (ndti < 0.15) return "#c9a227";
  return "#a0522d";
}
