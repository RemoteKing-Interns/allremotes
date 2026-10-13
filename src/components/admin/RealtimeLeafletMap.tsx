"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Visitor { id: string; page: string; device: string; source: string; location?: string; lat?: number; lon?: number }

// Zoom the map to fit current visitors on first data load.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 5);
      return;
    }
    map.fitBounds(points, { padding: [60, 60], maxZoom: 5 });
  }, [points.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
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

  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200">
      <MapContainer
        center={[-27, 134]}
        zoom={4}
        minZoom={2}
        worldCopyJump
        className="h-[420px] w-full"
        attributionControl
      >
        {/* Mapbox light-v11 — clean GA4-style basemap; falls back to CARTO if
            the public token isn't configured. */}
        <TileLayer
          url={process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
          tileSize={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 512 : 256}
          zoomOffset={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? -1 : 0}
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds points={points} />
        {clusters.map((c, i) => (
          <CircleMarker
            key={i}
            center={[c.lat, c.lon]}
            radius={Math.min(8 + c.items.length * 3, 22)}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: "#10b981",
              fillOpacity: 0.85,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent={c.items.length > 1}>
              <div className="text-xs">
                {c.items.length > 1 && <b>{c.items.length} visitors — </b>}
                {c.items.map((v) => `${v.location || "Unknown"}: ${v.page}`).slice(0, 5).join(" · ")}
                {c.items.length > 5 && ` +${c.items.length - 5} more`}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {clusters.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-3 z-[500] text-center text-sm text-neutral-500">
          No located visitors right now
        </p>
      )}
    </div>
  );
}
