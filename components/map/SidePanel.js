"use client";

import Link from "next/link";
import { LATEST_ROUND, ROUNDS, WATER_LEVEL_STATIONS } from "@/lib/rivers";
import { LEVELS, MOCK_NOW, STANDARD, thaiDate } from "@/lib/risk";

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const RAIN = {
  upstream: [0, 0, 2, 0, 0, 5, 1],
  chiangRai: [0, 0, 1, 0, 0, 3, 0],
};

export default function SidePanel({ stations, selectedId, onSelect, waterLevels, secondsAgo }) {
  const selected = stations.find((s) => s.id === selectedId);
  return (
    <aside className="w-full overflow-y-auto border-l border-line bg-background md:w-[400px]">
      <div className="space-y-3 p-4">
        {selected ? (
          <StationDetail station={selected} onBack={() => onSelect(null)} />
        ) : (
          <Overview stations={stations} onSelect={onSelect} />
        )}
        <LiveWater waterLevels={waterLevels} secondsAgo={secondsAgo} />
        <RainForecast />
      </div>
    </aside>
  );
}

function Card({ title, right, children }) {
  return (
    <section className="rounded-xl border border-line bg-white p-4 shadow-sm">
      {title && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function Badge({ level, big }) {
  const lv = LEVELS[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${big ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-[11px]"}`}
      style={{ background: lv.bg, color: lv.text }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: lv.color }} />
      {lv.label}
    </span>
  );
}

function Overview({ stations, onSelect }) {
  const exceed = stations.filter((s) => s.assessment.value !== null && s.assessment.value > STANDARD).length;
  const age = stations[0].assessment.age;
  const order = { high: 0, watch: 1, low: 2 };
  const sorted = [...stations].sort((a, b) => order[a.assessment.level] - order[b.assessment.level] || a.id.localeCompare(b.id));
  return (
    <>
      <Card>
        <div className="text-[12px] text-muted">สถานการณ์แม่น้ำกก · {thaiDate(MOCK_NOW)}</div>
        <div className="mt-1 text-[20px] font-bold leading-snug">
          สารหนูเกินมาตรฐาน <span className="text-[#c0392b]">{exceed} จาก {stations.length}</span> จุดตรวจ
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
          <Stat label="ผลตรวจรอบล่าสุด" value={thaiDate(LATEST_ROUND)} />
          <Stat label="อายุของข้อมูล" value={`${age} วัน`} warn={age > 60} />
        </div>
        <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[12.5px] leading-relaxed text-amber-900">
          <b>ฤดูแล้ง:</b> น้ำน้อยทำให้สารหนูในน้ำเจือจางน้อยลง และข้อมูลล่าสุดเก่ากว่า 60 วัน ระบบจึงปรับจุดที่ “ต่ำ” ขึ้นเป็น “เฝ้าระวัง”
        </div>
      </Card>

      <Card title="จุดตรวจทั้งหมด" right={<span className="text-[11px] text-muted">แตะเพื่อดูรายละเอียด</span>}>
        <ul className="divide-y divide-line">
          {sorted.map((s) => (
            <li key={s.id}>
              <button onClick={() => onSelect(s.id)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-gray-50">
                <span className="w-12 font-bold">{s.id}</span>
                <span className="flex-1 truncate text-[13px] text-muted">{s.area}</span>
                <span className="w-14 text-right text-[12px] tabular-nums">
                  {s.assessment.value !== null ? s.assessment.value.toFixed(3) : "—"}
                </span>
                <Badge level={s.assessment.level} />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted">ค่าเป็น มก./ล. ในรอบ {thaiDate(LATEST_ROUND)} · “—” คือไม่มีรายงานค่าเกิน · ตำแหน่งจุดบนแผนที่เป็นค่าประมาณ</p>
      </Card>
    </>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
      <div className="text-muted">{label}</div>
      <div className={`text-[15px] font-bold ${warn ? "text-amber-700" : ""}`}>{value}</div>
    </div>
  );
}

function StationDetail({ station, onBack }) {
  const a = station.assessment;
  const sat = station.satellite.at(-1);
  const turb = [...station.history].reverse().find((h) => h.turbidity !== null);
  const question = `ใช้น้ำแม่น้ำกกบริเวณ ${station.id} (${station.area}) ทำนาได้ไหม`;
  return (
    <Card>
      <button onClick={onBack} className="mb-2 text-[13px] font-semibold text-brand">← กลับไปภาพรวม</button>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[22px] font-bold leading-tight">จุดตรวจ {station.id}</div>
          <div className="text-[13px] text-muted">{station.area} · แม่น้ำกก</div>
        </div>
        <Badge level={a.level} big />
      </div>
      <p className="mt-2 text-[13px] leading-relaxed">{a.reason}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
        <Stat label="สารหนูล่าสุด" value={a.value !== null ? a.value.toFixed(3) : "ไม่เกิน"} warn={a.value > STANDARD} />
        <Stat label="ความขุ่น (NTU)" value={turb?.turbidity ?? "—"} />
        <Stat label="NDTI ดาวเทียม" value={sat ? sat.ndti.toFixed(3) : "—"} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[12px]">
          <span className="font-bold">สารหนูในน้ำทุกรอบ (มก./ล.)</span>
          <span className="text-muted">เส้นประ = มาตรฐาน 0.010</span>
        </div>
        <ArsenicChart history={station.history} />
      </div>

      <div className="mt-4 rounded-lg border border-brand/30 bg-brand-light p-3 text-[13px] leading-relaxed">
        <div className="mb-1 font-bold text-brand">คำแนะนำ</div>
        <ul className="list-disc space-y-1 pl-4">
          <li>งดใช้น้ำจากแม่น้ำโดยตรงสำหรับดื่มและประกอบอาหาร ใช้น้ำประปา กปภ. หรือน้ำดื่มบรรจุขวดแทน</li>
          <li>การต้มน้ำ <b>ไม่ได้</b> กำจัดสารหนู แต่ทำให้เข้มข้นขึ้น</li>
          <li>เด็กเล็ก หญิงตั้งครรภ์ และผู้สูงอายุ ควรเลี่ยงการสัมผัสน้ำและตะกอนดิน</li>
        </ul>
        <p className="mt-2 text-[11px] text-muted">
          ข้อมูลจากผลตรวจ คพ. รอบ {thaiDate(LATEST_ROUND)} ({a.age} วันก่อน) · ไม่ใช่การรับรองความปลอดภัย
        </p>
      </div>

      <Link
        href={`/chat?q=${encodeURIComponent(question)}`}
        className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-[14px] font-bold text-white hover:bg-brand-dark"
      >
        ถามแชต AI เกี่ยวกับจุดนี้
      </Link>
    </Card>
  );
}

function ArsenicChart({ history }) {
  const W = 340;
  const H = 96;
  const pad = { l: 30, r: 6, t: 8, b: 18 };
  const max = 0.04;
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (ROUNDS.length - 1);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const byDate = Object.fromEntries(history.map((h) => [h.date, h]));
  const pts = ROUNDS.map((d, i) => ({ d, i, v: byDate[d]?.arsenic ?? null, sampled: Boolean(byDate[d]) }));
  const line = pts.filter((p) => p.v !== null);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.02, 0.04].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#e5ecee" />
          <text x={pad.l - 4} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#5c6b73">{v.toFixed(2)}</text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={y(STANDARD)} y2={y(STANDARD)} stroke="#c0392b" strokeDasharray="4 3" />
      <polyline points={line.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")} fill="none" stroke="#0f6e74" strokeWidth="1.5" />
      {pts.map((p) =>
        p.v !== null ? (
          <circle key={p.d} cx={x(p.i)} cy={y(p.v)} r="3" fill={p.v > STANDARD ? "#c0392b" : "#d98a1c"}>
            <title>{`${thaiDate(p.d)}: ${p.v.toFixed(3)} มก./ล.`}</title>
          </circle>
        ) : p.sampled ? (
          <rect key={p.d} x={x(p.i) - 1.5} y={y(0) - 3} width="3" height="3" fill="#9aa7ad">
            <title>{`${thaiDate(p.d)}: ไม่รายงานค่าเกิน`}</title>
          </rect>
        ) : null,
      )}
      <text x={pad.l} y={H - 4} fontSize="9" fill="#5c6b73">{thaiDate(ROUNDS[0])}</text>
      <text x={W - pad.r} y={H - 4} fontSize="9" fill="#5c6b73" textAnchor="end">{thaiDate(ROUNDS.at(-1))}</text>
    </svg>
  );
}

function LiveWater({ waterLevels, secondsAgo }) {
  return (
    <Card
      title="ระดับน้ำสด"
      right={
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="live-dot h-2 w-2 rounded-full bg-red-500" />
          อัปเดต {secondsAgo} วินาทีก่อน
        </span>
      }
    >
      <ul className="space-y-2">
        {WATER_LEVEL_STATIONS.map((w) => {
          const lv = waterLevels[w.id];
          const pct = Math.min(100, (lv.value / w.bank) * 100);
          return (
            <li key={w.id}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-semibold">{w.name}</span>
                <span className="tabular-nums">
                  <b className="text-[15px]">{lv.value.toFixed(2)}</b> ม.
                  <span className={`ml-1 text-[11px] ${lv.delta > 0 ? "text-red-600" : lv.delta < 0 ? "text-blue-600" : "text-muted"}`}>
                    {lv.delta > 0 ? "▲" : lv.delta < 0 ? "▼" : "•"}
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded bg-gray-100">
                <div className="h-1.5 rounded bg-[#1d4e89]" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-0.5 text-[11px] text-muted">{Math.round(pct)}% ของความจุลำน้ำ (ตลิ่ง {w.bank} ม.)</div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-muted">ค่าจำลอง · ระบบจริงจะดึงจาก ThaiWater API ทุก 15 นาที · น้ำต่ำ = สารหนูเจือจางน้อย</p>
    </Card>
  );
}

function RainForecast() {
  const start = new Date(`${MOCK_NOW}T00:00:00`);
  const days = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(start.getDay() + i) % 7]);
  const max = 10;
  return (
    <Card title="พยากรณ์ฝน 7 วัน" right={<span className="text-[11px] text-muted">Open-Meteo · จำลอง</span>}>
      {[
        ["ต้นน้ำกก (รัฐฉาน)", RAIN.upstream],
        ["เชียงราย", RAIN.chiangRai],
      ].map(([label, vals]) => (
        <div key={label} className="mb-2">
          <div className="mb-1 text-[12px] font-semibold">{label}</div>
          <div className="flex items-end gap-1.5">
            {vals.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-[10px] tabular-nums text-muted">{v}</span>
                <div className="w-full rounded-t bg-[#3a86c8]" style={{ height: `${4 + (v / max) * 36}px`, opacity: v ? 1 : 0.25 }} />
                <span className="text-[10px] text-muted">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted">หน่วย มม./วัน · ไม่มีฝนหนักต้นน้ำในสัปดาห์นี้</p>
    </Card>
  );
}
