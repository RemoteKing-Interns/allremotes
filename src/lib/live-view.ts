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
      sessions: sessions.map((s) => ({
        id: String(s.sessionId).slice(-8), page: s.page, title: s.title,
        device: s.device || "unknown", source: s.source || "Direct",
        lastSeen: s.lastSeen,
      })),
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
