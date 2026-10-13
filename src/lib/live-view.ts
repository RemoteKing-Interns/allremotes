import { getDb } from "@/lib/mongo";

export type ActivityType = "page_view" | "product_view" | "add_to_cart" | "checkout_start" | "purchase" | "search";

const SESSION_TTL_MS = 5 * 60 * 1000;
const COLLECTION_SESSIONS = "analyticsLiveSessions";
const COLLECTION_EVENTS = "analyticsEvents";
let indexesReady: Promise<void> | null = null;

function ensureIndexes() {
  if (!indexesReady) indexesReady = (async () => {
    const db = await getDb();
    await Promise.all([
      db.collection(COLLECTION_SESSIONS).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection(COLLECTION_SESSIONS).createIndex({ lastSeen: -1 }),
      db.collection(COLLECTION_EVENTS).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection(COLLECTION_EVENTS).createIndex({ timestamp: -1 }),
    ]);
  })();
  return indexesReady;
}

// Timezone → approximate [lat, lon] for the realtime map. Coarse by design —
// no IP geolocation is stored or performed.
const TZ_GEO: Record<string, [number, number]> = {
  "Australia/Sydney": [-33.87, 151.21], "Australia/Melbourne": [-37.81, 144.96],
  "Australia/Brisbane": [-27.47, 153.03], "Australia/Perth": [-31.95, 115.86],
  "Australia/Adelaide": [-34.93, 138.6], "Australia/Darwin": [-12.46, 130.84],
  "Australia/Hobart": [-42.88, 147.33], "Australia/Canberra": [-35.28, 149.13],
  "Australia/Alice_Springs": [-23.7, 133.88], "Australia/Broken_Hill": [-31.95, 141.45],
  "Pacific/Auckland": [-36.85, 174.76], "Pacific/Fiji": [-18.14, 178.42],
  "Pacific/Port_Moresby": [-9.44, 147.18], "Pacific/Noumea": [-22.28, 166.46],
  "Asia/Singapore": [1.35, 103.82], "Asia/Tokyo": [35.68, 139.69],
  "Asia/Hong_Kong": [22.32, 114.17], "Asia/Shanghai": [31.23, 121.47],
  "Asia/Kolkata": [28.61, 77.21], "Asia/Calcutta": [22.57, 88.36],
  "Asia/Dubai": [25.2, 55.27], "Asia/Jakarta": [-6.21, 106.85],
  "Asia/Manila": [14.6, 120.98], "Asia/Bangkok": [13.76, 100.5],
  "Asia/Seoul": [37.57, 126.98], "Asia/Taipei": [25.03, 121.57],
  "Europe/London": [51.51, -0.13], "Europe/Paris": [48.86, 2.35],
  "Europe/Berlin": [52.52, 13.41], "Europe/Madrid": [40.42, -3.7],
  "Europe/Rome": [41.9, 12.5], "Europe/Moscow": [55.76, 37.62],
  "Europe/Amsterdam": [52.37, 4.9], "Europe/Stockholm": [59.33, 18.07],
  "America/New_York": [40.71, -74.01], "America/Chicago": [41.88, -87.63],
  "America/Denver": [39.74, -104.99], "America/Los_Angeles": [34.05, -118.24],
  "America/Toronto": [43.65, -79.38], "America/Vancouver": [49.28, -123.12],
  "America/Sao_Paulo": [-23.55, -46.63], "America/Mexico_City": [19.43, -99.13],
  "Africa/Johannesburg": [-26.2, 28.05], "Africa/Cairo": [30.04, 31.24],
};

function geoForTimezone(tz?: string): { lat: number; lon: number; label: string } | undefined {
  if (!tz) return undefined;
  const hit = TZ_GEO[tz];
  if (hit) return { lat: hit[0], lon: hit[1], label: tz.split("/").pop()!.replace(/_/g, " ") };
  // Region-level fallback on the IANA prefix.
  const region = tz.split("/")[0];
  const FALLBACK: Record<string, [number, number]> = {
    Australia: [-33.87, 151.21], Pacific: [-36.85, 174.76], Asia: [35.68, 139.69],
    Europe: [51.51, -0.13], America: [40.71, -74.01], Africa: [30.04, 31.24],
  };
  const f = FALLBACK[region];
  return f ? { lat: f[0], lon: f[1], label: region } : undefined;
}

function sourceFromReferrer(referrer?: string) {
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.endsWith("allremotes.com.au")) return "Internal";
    if (/google\./.test(host)) return "Google";
    if (/facebook\.com|instagram\.com|fb\.com/.test(host)) return "Meta";
    if (/bing\.com/.test(host)) return "Bing";
    return host;
  } catch {
    return "Other";
  }
}

class LiveViewStore {
  async heartbeat(sessionId: string, page: string, extras: Record<string, unknown> = {}) {
    await ensureIndexes();
    const db = await getDb();
    const now = new Date();
    await db.collection(COLLECTION_SESSIONS).updateOne(
      { sessionId },
      {
        $set: { page, lastSeen: now, expiresAt: new Date(now.getTime() + SESSION_TTL_MS), ...extras },
        $setOnInsert: { sessionId, firstSeen: now, source: sourceFromReferrer(String(extras.referrer || "")) },
      },
      { upsert: true },
    );
  }

  async recordActivity(sessionId: string, type: ActivityType, page: string, title?: string, metadata?: Record<string, unknown>) {
    await ensureIndexes();
    const db = await getDb();
    const now = new Date();
    await db.collection(COLLECTION_EVENTS).insertOne({
      sessionId, type, page, title, metadata, timestamp: now,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  async getStats() {
    await ensureIndexes();
    const db = await getDb();
    const cutoff = new Date(Date.now() - SESSION_TTL_MS);
    const [sessions, recent] = await Promise.all([
      db.collection(COLLECTION_SESSIONS).find({ lastSeen: { $gte: cutoff } })
        .sort({ lastSeen: -1 }).limit(100).toArray(),
      db.collection(COLLECTION_EVENTS).find({}).sort({ timestamp: -1 }).limit(20).toArray(),
    ]);

    const pageCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    for (const s of sessions) {
      const page = String(s.page || "/");
      const device = String(s.device || "unknown");
      const source = String(s.source || "Direct");
      pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
      deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    }
    const ranked = (m: Map<string, number>, key: string) => [...m.entries()]
      .map(([name, count]) => ({ [key]: name, count })).sort((a, b) => b.count - a.count);

    return {
      activeVisitors: sessions.length,
      topPages: [...pageCounts.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 10),
      devices: ranked(deviceCounts, "device"),
      sources: ranked(sourceCounts, "source"),
      sessions: sessions.map((s) => {
        const geo = geoForTimezone(s.timezone);
        return {
          id: String(s.sessionId).slice(-8), page: s.page, title: s.title,
          device: s.device || "unknown", source: s.source || "Direct",
          location: geo?.label, lat: geo?.lat, lon: geo?.lon,
          lastSeen: s.lastSeen,
        };
      }),
      recentActivity: recent.map((a) => ({
        id: String(a._id), type: a.type, page: a.page,
        label: labelForActivity(a), timeAgo: timeAgo(new Date(a.timestamp).getTime()),
      })),
    };
  }
}

function timeAgo(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function labelForActivity(a: any) {
  const display = a.title || a.page;
  if (a.type === "page_view") return `Page viewed: ${display}`;
  if (a.type === "product_view") return `Product viewed: ${display}`;
  if (a.type === "add_to_cart") return `Added to cart: ${a.metadata?.productName || display}`;
  if (a.type === "checkout_start") return "Checkout started";
  if (a.type === "purchase") return "Order completed";
  if (a.type === "search") return `Searched: "${a.metadata?.q || ""}"`;
  return display;
}

export const liveViewStore = new LiveViewStore();
