"use client";

import { useEffect, useMemo, useState } from "react";

// Rough continent outlines (lat/lon) filled with dots — a self-contained
// equirectangular world map, no GeoJSON dependency needed.
const CONTINENTS: [number, number][][] = [
  // North America
  [[-168,65],[-160,70],[-140,70],[-130,70],[-110,73],[-95,80],[-80,73],[-70,62],[-55,52],[-65,45],[-75,40],[-75,35],[-80,32],[-80,25],[-90,20],[-97,25],[-105,20],[-110,23],[-115,28],[-120,34],[-125,40],[-125,48],[-130,55],[-140,60],[-155,58],[-165,60]],
  // Greenland
  [[-60,75],[-45,70],[-25,70],[-20,75],[-30,80],[-55,82],[-65,76]],
  // South America
  [[-80,9],[-75,10],[-60,8],[-50,0],[-40,-3],[-35,-8],[-40,-20],[-50,-30],[-58,-35],[-65,-45],[-70,-52],[-75,-50],[-72,-40],[-70,-25],[-70,-18],[-78,-8],[-81,-3]],
  // Europe
  [[-10,36],[-9,43],[-2,48],[-5,50],[0,52],[5,58],[8,58],[10,57],[15,55],[20,55],[25,58],[30,60],[30,65],[40,68],[45,60],[40,55],[45,48],[40,45],[35,45],[30,40],[28,40],[23,38],[18,40],[15,40],[12,44],[8,44],[3,43],[0,40],[-5,36]],
  // UK & Ireland
  [[-6,50],[-3,53],[-2,56],[-5,58],[-7,55],[-10,52],[-8,51]],
  // Africa
  [[-17,15],[-10,5],[-5,5],[0,5],[8,4],[10,0],[12,-5],[15,-12],[18,-20],[20,-33],[25,-34],[30,-32],[35,-25],[38,-15],[40,-10],[42,-2],[48,-1],[51,10],[45,12],[40,15],[37,18],[35,22],[32,30],[25,32],[20,33],[10,35],[5,36],[-5,35],[-10,30],[-15,25],[-17,20]],
  // Madagascar
  [[44,-16],[47,-15],[50,-17],[49,-22],[45,-25],[43,-24],[44,-20]],
  // Asia
  [[45,40],[50,45],[55,50],[50,55],[55,60],[60,65],[70,70],[80,73],[95,75],[110,75],[125,72],[140,72],[155,70],[170,66],[178,65],[170,60],[160,60],[155,58],[160,55],[150,55],[142,50],[140,45],[135,42],[130,40],[128,38],[122,38],[120,32],[122,30],[118,25],[110,20],[108,15],[105,8],[100,10],[98,10],[95,15],[92,20],[88,22],[85,20],[80,10],[77,8],[75,15],[72,20],[68,23],[65,25],[60,25],[55,26],[52,28],[50,30],[48,30]],
  // Japan
  [[130,31],[132,33],[135,34],[138,35],[140,38],[142,42],[145,44],[143,43],[140,40],[137,36],[133,33],[131,31]],
  // SE Asia / Indonesia
  [[95,5],[100,2],[105,0],[110,-3],[115,-5],[120,-8],[125,-8],[130,-8],[135,-5],[140,-8],[140,-5],[135,-2],[130,-2],[125,-1],[120,0],[115,2],[110,4],[105,5],[100,7]],
  // Papua New Guinea
  [[140,-8],[145,-6],[150,-9],[147,-10],[142,-10]],
  // Australia
  [[113,-22],[115,-20],[120,-14],[125,-15],[130,-12],[132,-11],[135,-12],[137,-12],[140,-12],[142,-11],[145,-15],[147,-19],[150,-22],[153,-26],[153,-30],[150,-36],[147,-38],[144,-38],[140,-38],[138,-35],[135,-35],[132,-32],[129,-32],[126,-33],[122,-34],[118,-35],[115,-34],[114,-30],[113,-25]],
  // Tasmania
  [[145,-41],[148,-41],[147,-43],[145,-43]],
  // New Zealand
  [[173,-35],[176,-38],[174,-41],[172,-43],[169,-46],[167,-46],[170,-44],[173,-41],[174,-39]],
];

const W = 1000, H = 500, STEP = 3; // degrees — ~120x60 grid

function inPolygon(lat: number, lon: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]; // xi=lon, yi=lat
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const px = (lon: number) => ((lon + 180) / 360) * W;
const py = (lat: number) => ((90 - lat) / 180) * H;

function buildLandDots() {
  const dots: [number, number][] = [];
  for (let lat = 80; lat >= -55; lat -= STEP) {
    for (let lon = -180; lon < 180; lon += STEP) {
      for (const poly of CONTINENTS) {
        if (inPolygon(lat, lon, poly)) { dots.push([px(lon), py(lat)]); break; }
      }
    }
  }
  return dots;
}

interface Visitor { id: string; page: string; device: string; source: string; location?: string; lat?: number; lon?: number }

export default function RealtimeMap({ sessions }: { sessions: Visitor[] }) {
  const land = useMemo(buildLandDots, []);
  // Cluster visitors sharing a location into one bubble with a count —
  // keeps the map readable when several visitors hit the same city.
  const clusters = useMemo(() => {
    const map = new Map<string, { x: number; y: number; items: Visitor[] }>();
    for (const v of sessions) {
      if (v.lat === undefined || v.lon === undefined) continue;
      const key = `${v.lat!.toFixed(1)}|${v.lon!.toFixed(1)}`;
      const c = map.get(key) || { x: px(v.lon!), y: py(v.lat!), items: [] };
      c.items.push(v);
      map.set(key, c);
    }
    return [...map.values()];
  }, [sessions]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-b from-sky-50 to-blue-50">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Live visitor map">
        {land.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.2} className="fill-neutral-300" />
        ))}
        {clusters.map((c, i) => {
          const n = c.items.length;
          const pulse = 6 + ((tick + i) % 3) * 3;
          const r = n > 1 ? 11 : 4.5;
          return (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r={pulse + n * 2} className="fill-emerald-400 opacity-30 transition-all duration-700" />
              <circle cx={c.x} cy={c.y} r={r} className="fill-emerald-500 stroke-white" strokeWidth={1.5}>
                <title>{c.items.map((v) => `${v.location || "Unknown"} — ${v.page}`).join("\n")}</title>
              </circle>
              {n > 1 && (
                <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-white pointer-events-none">
                  {n}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {clusters.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
          No located visitors right now
        </p>
      )}
    </div>
  );
}
