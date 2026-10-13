"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` on import — load the real map client-side only.
const Map = dynamic(() => import("./RealtimeLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
      Loading map…
    </div>
  ),
});

interface Visitor { id: string; page: string; device: string; source: string; location?: string; lat?: number; lon?: number }

export default function RealtimeMap({ sessions }: { sessions: Visitor[] }) {
  return <Map sessions={sessions} />;
}
