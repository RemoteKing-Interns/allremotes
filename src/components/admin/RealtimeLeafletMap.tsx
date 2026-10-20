"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Visitor { id: string; page: string; device: string; source: string; location?: string; lat?: number; lon?: number }

const DEVICE_COLOR: Record<string, string> = {
  mobile: "#34d399",   // emerald
  desktop: "#818cf8",  // indigo
  tablet: "#fbbf24",   // amber
};
const colorFor = (d: string) => DEVICE_COLOR[(d || "").toLowerCase()] || "#22d3ee";

// Zoom the map to fit current visitors on first data load.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView(points[0], 5); return; }
    map.fitBounds(points, { padding: [60, 60], maxZoom: 5 });
  }, [points.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function pulseIcon(color: string, count: number) {
  const size = Math.min(16 + count * 4, 34);
  return L.divIcon({
    className: "visitor-pulse-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="vp-wrap" style="--c:${color};--s:${size}px">
        <span class="vp-ring"></span>
        <span class="vp-ring vp-ring-2"></span>
        <span class="vp-dot">${count > 1 ? `<b>${count}</b>` : ""}</span>
      </div>`,
  });
}

export default function RealtimeLeafletMap({ sessions }: { sessions: Visitor[] }) {
  const clusters = useMemo(() => {
    const map = new Map<string, { lat: number; lon: number; items: Visitor[] }>();
    for (const v of sessions) {
      if (v.lat === undefined || v.lon === undefined) continue;
      const key = `${v.lat.toFixed(1)}|${v.lon.toFixed(1)}`;
      const c = map.get(key) || { lat: v.lat, lon: v.lon, items: [] };
      c.items.push(v);
      map.set(key, c);
    }
    return [...map.values()];
  }, [sessions]);

  const points = clusters.map((c) => [c.lat, c.lon] as [number, number]);
  const located = clusters.reduce((n, c) => n + c.items.length, 0);
  const dark = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
      <style>{`
        .visitor-pulse-icon { background: none; border: none; }
        .vp-wrap { position: relative; width: var(--s); height: var(--s); }
        .vp-dot {
          position: absolute; inset: 0; border-radius: 9999px;
          background: var(--c); border: 2px solid rgba(255,255,255,.9);
          box-shadow: 0 0 12px var(--c), 0 0 30px color-mix(in srgb, var(--c) 60%, transparent);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 700;
          animation: vp-pop .35s cubic-bezier(.34,1.56,.64,1);
        }
        .vp-ring {
          position: absolute; inset: -40%; border-radius: 9999px;
          border: 2px solid var(--c); opacity: .9;
          animation: vp-ping 2.2s cubic-bezier(0,0,.2,1) infinite;
        }
        .vp-ring-2 { animation-delay: 1.1s; }
        @keyframes vp-ping {
          0% { transform: scale(.55); opacity: .9; }
          80%, 100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes vp-pop {
          0% { transform: scale(0); } 100% { transform: scale(1); }
        }
        .live-dot { animation: live-blink 1.4s ease-in-out infinite; }
        @keyframes live-blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
        .leaflet-container { background: #0a0f1e; }
      `}</style>

      <MapContainer center={[-27, 134]} zoom={4} minZoom={2} worldCopyJump className="h-[420px] w-full" attributionControl>
        <TileLayer
          url={dark}
          tileSize={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 512 : 256}
          zoomOffset={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? -1 : 0}
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds points={points} />
        {clusters.map((c, i) => {
          const main = c.items[0];
          return (
            <Marker key={i} position={[c.lat, c.lon]} icon={pulseIcon(colorFor(main.device), c.items.length)}>
              <Tooltip direction="top" offset={[0, -14]}>
                <div className="text-xs">
                  {c.items.length > 1 && <b>{c.items.length} visitors — </b>}
                  {c.items.map((v) => `${v.location || "Unknown"}: ${v.page}`).slice(0, 5).join(" · ")}
                  {c.items.length > 5 && ` +${c.items.length - 5} more`}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* depth vignette */}
      <div className="pointer-events-none absolute inset-0 z-[400] shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]" />

      {/* live badge */}
      <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur-sm">
        <span className="live-dot inline-block h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold tracking-wide text-white">
          LIVE · {located} {located === 1 ? "visitor" : "visitors"} · {clusters.length} {clusters.length === 1 ? "location" : "locations"}
        </span>
      </div>

      {/* device legend */}
      <div className="absolute bottom-3 left-3 z-[500] flex gap-3 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur-sm">
        {Object.entries(DEVICE_COLOR).map(([d, c]) => (
          <span key={d} className="flex items-center gap-1.5 text-[11px] capitalize text-neutral-200">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
            {d}
          </span>
        ))}
      </div>

      {clusters.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-12 z-[500] text-center text-sm text-neutral-400">
          No located visitors right now
        </p>
      )}
    </div>
  );
}
