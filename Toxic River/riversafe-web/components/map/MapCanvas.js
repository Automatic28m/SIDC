"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { RIVERS, WATER_LEVEL_STATIONS } from "@/lib/rivers";
import { LEVELS, ndtiColor } from "@/lib/risk";

// Yesterday's date in UTC, for NASA GIBS daily imagery (today's tiles are often still empty).
function gibsDate() {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 11), { duration: 0.8 });
  }, [map, position]);
  return null;
}

function waterIcon(name, value) {
  return L.divIcon({
    className: "",
    iconSize: null,
    html: `<div style="transform:translate(-50%,-100%);display:inline-flex;flex-direction:column;align-items:center">
      <div style="background:#1d4e89;color:#fff;border-radius:8px;padding:2px 7px;font:600 12px var(--font-sarabun),sans-serif;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.3)">
        ${value.toFixed(2)} ม.</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #1d4e89"></div>
    </div>`,
  });
}

export default function MapCanvas({ stations, layers, waterLevels, selectedId, onSelect }) {
  const date = useMemo(() => gibsDate(), []);
  const selected = stations.find((s) => s.id === selectedId);

  // Turbidity segments: colour the river between consecutive stations by the latest Sentinel-2 NDTI.
  const turbiditySegments = useMemo(
    () =>
      stations.slice(0, -1).map((s, i) => {
        const next = stations[i + 1];
        const latest = s.satellite.at(-1);
        return { id: s.id, positions: [s.position, next.position], color: ndtiColor(latest?.ndti), ndti: latest?.ndti, date: latest?.date };
      }),
    [stations],
  );

  return (
    <MapContainer bounds={[[19.85, 99.25], [20.47, 100.43]]} minZoom={7} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
      />
      {layers.satellite && (
        <TileLayer
          attribution="NASA GIBS / VIIRS"
          url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
          maxNativeZoom={9}
          maxZoom={18}
          opacity={0.85}
        />
      )}

      {RIVERS.map((r) => (
        <Polyline key={r.id} positions={r.coords} pathOptions={{ color: "#2b7bb9", weight: 6, opacity: 0.55 }}>
          <Tooltip sticky>{r.name}</Tooltip>
        </Polyline>
      ))}

      {layers.turbidity &&
        turbiditySegments.map((seg) => (
          <Polyline key={seg.id} positions={seg.positions} pathOptions={{ color: seg.color, weight: 9, opacity: 0.9 }}>
            <Tooltip sticky>
              ความขุ่น (NDTI) {seg.ndti?.toFixed(3) ?? "ไม่มีภาพไร้เมฆ"} · Sentinel-2 {seg.date ?? ""}
            </Tooltip>
          </Polyline>
        ))}

      {layers.stations &&
        stations.map((s) => {
          const lv = LEVELS[s.assessment.level];
          const isSel = s.id === selectedId;
          return (
            <CircleMarker
              key={s.id}
              center={s.position}
              radius={isSel ? 11 : 8}
              pathOptions={{ color: isSel ? "#1b2a33" : "#fff", weight: isSel ? 3 : 2, fillColor: lv.color, fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelect(s.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]} className="station-tip">
                {s.id} · {lv.label}
              </Tooltip>
            </CircleMarker>
          );
        })}

      {layers.waterLevel &&
        WATER_LEVEL_STATIONS.map((w) => (
          <Marker key={w.id} position={w.position} icon={waterIcon(w.name, waterLevels[w.id]?.value ?? w.base)}>
            <Tooltip direction="bottom">{w.name} (จำลอง ThaiWater)</Tooltip>
          </Marker>
        ))}

      <FlyTo position={selected?.position} />
    </MapContainer>
  );
}
