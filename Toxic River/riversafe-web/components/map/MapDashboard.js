"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { STATIONS, LATEST_ROUND, WATER_LEVEL_STATIONS } from "@/lib/rivers";
import { assessStation } from "@/lib/risk";
import SidePanel from "./SidePanel";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">กำลังโหลดแผนที่…</div>,
});

const LAYER_OPTIONS = [
  { key: "stations", label: "จุดตรวจสารหนู (คพ.)", note: "ทุกรอบที่ คพ. เผยแพร่" },
  { key: "waterLevel", label: "ระดับน้ำสด (ThaiWater)", note: "ทุก 15 นาที · จำลอง" },
  { key: "turbidity", label: "ความขุ่น Sentinel-2", note: "ทุก ~5 วัน" },
  { key: "satellite", label: "ภาพดาวเทียมรายวัน (NASA)", note: "ทุกวัน · ภาพจริง" },
];

function initialLevels() {
  return Object.fromEntries(WATER_LEVEL_STATIONS.map((w) => [w.id, { value: w.base, delta: 0 }]));
}

export default function MapDashboard() {
  const stations = useMemo(
    () => STATIONS.map((s) => ({ ...s, assessment: assessStation(s, LATEST_ROUND) })),
    [],
  );
  const [selectedId, setSelectedId] = useState(null);
  const [layers, setLayers] = useState({ stations: true, waterLevel: true, turbidity: false, satellite: false });
  const [waterLevels, setWaterLevels] = useState(initialLevels);
  const [secondsAgo, setSecondsAgo] = useState(0);
  // null = default: open on desktop, collapsed on phones (decided by CSS, no hydration mismatch)
  const [layersOpen, setLayersOpen] = useState(null);

  // Simulated live feed: small random walk every 5 seconds, standing in for the ThaiWater API poll.
  useEffect(() => {
    const tick = setInterval(() => {
      setWaterLevels((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([id, { value }]) => {
            const delta = Math.round((Math.random() - 0.5) * 2) / 100;
            return [id, { value: Math.max(0.3, value + delta), delta }];
          }),
        ),
      );
      setSecondsAgo(0);
    }, 5000);
    const clock = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => {
      clearInterval(tick);
      clearInterval(clock);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col md:h-[calc(100vh-3.5rem)] md:flex-none md:flex-row">
      <div className="relative h-[55vh] md:h-auto md:flex-1">
        <MapCanvas
          stations={stations}
          layers={layers}
          waterLevels={waterLevels}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Layer switcher */}
        <div className="absolute left-3 top-3 z-[500] w-52 rounded-xl md:w-60 border border-line bg-white/95 shadow-md backdrop-blur">
          <button
            onClick={() => setLayersOpen((o) => (o === null ? window.innerWidth < 768 : !o))}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-bold"
          >
            ชั้นข้อมูลบนแผนที่
            <span className="text-muted">
              {layersOpen === null ? (
                <>
                  <span className="md:hidden">+</span>
                  <span className="hidden md:inline">−</span>
                </>
              ) : layersOpen ? (
                "−"
              ) : (
                "+"
              )}
            </span>
          </button>
          {(
            <div className={`space-y-1 border-t border-line px-3 py-2 ${layersOpen === null ? "hidden md:block" : layersOpen ? "block" : "hidden"}`}>
              {LAYER_OPTIONS.map((o) => (
                <label key={o.key} className="flex cursor-pointer items-start gap-2 py-1">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[#0f6e74]"
                    checked={layers[o.key]}
                    onChange={() => setLayers((l) => ({ ...l, [o.key]: !l[o.key] }))}
                  />
                  <span className="leading-tight">
                    <span className="block text-[13px] font-semibold">{o.label}</span>
                    <span className="text-[11px] text-muted">{o.note}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[500] rounded-xl border border-line bg-white/95 px-3 py-2 text-[12px] shadow-md">
          <div className="mb-1 font-bold">ระดับความเสี่ยง</div>
          <div className="flex gap-3">
            <Legend color="#c0392b" label="สูง" />
            <Legend color="#d98a1c" label="เฝ้าระวัง" />
            <Legend color="#2e8b57" label="ต่ำ" />
          </div>
          {layers.turbidity && (
            <div className="mt-1 flex items-center gap-1 text-muted">
              ความขุ่น
              <span className="h-2 w-24 rounded" style={{ background: "linear-gradient(90deg,#3a86c8,#7a9e4a,#c9a227,#a0522d)" }} />
              สูง
            </div>
          )}
        </div>
      </div>

      <SidePanel
        stations={stations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        waterLevels={waterLevels}
        secondsAgo={secondsAgo}
      />
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: color }} />
      {label}
    </span>
  );
}
