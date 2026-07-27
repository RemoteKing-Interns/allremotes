/**
 * In-memory live visitor tracking.
 *
 * Ponytail: This is a single-process in-memory store. It works fine for dev
 * and a single-production Node instance. If you scale to multiple servers, swap
 * this for Redis or a shared store keyed by session ID.
 */

export type ActivityType = "page_view" | "product_view" | "add_to_cart" | "checkout_start" | "purchase" | "search";

export interface Session {
  id: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  lastSeen: number;
  page: string;
  device?: string;
}

export interface ActivityItem {
  id: string;
  sessionId: string;
  type: ActivityType;
  page: string;
  title?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface LiveViewStats {
  activeVisitors: number;
  topPages: { path: string; views: number }[];
  recentActivity: { id: string; type: ActivityType; label: string; timeAgo: string; page: string }[];
}

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ACTIVITY = 50;
const CLEANUP_INTERVAL_MS = 30 * 1000;

class LiveViewStore {
  private sessions = new Map<string, Session>();
  private pageViews = new Map<string, number>();
  private activity: ActivityItem[] = [];
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof globalThis === "undefined") return;
    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  private cleanup() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastSeen > SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }

  heartbeat(sessionId: string, page: string, extras: Partial<Session> = {}) {
    const now = Date.now();
    const existing = this.sessions.get(sessionId);
    const previousPage = existing?.page;
    this.sessions.set(sessionId, {
      id: sessionId,
      lastSeen: now,
      page,
      ...(existing ?? {}),
      ...extras,
    });
    if (previousPage !== page && page) {
      this.pageViews.set(page, (this.pageViews.get(page) ?? 0) + 1);
    }
  }

  recordActivity(sessionId: string, type: ActivityType, page: string, title?: string, metadata?: Record<string, any>) {
    const item: ActivityItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId,
      type,
      page,
      title,
      metadata,
      timestamp: Date.now(),
    };
    this.activity.unshift(item);
    if (this.activity.length > MAX_ACTIVITY) this.activity = this.activity.slice(0, MAX_ACTIVITY);
  }

  getStats(): LiveViewStats {
    const now = Date.now();
    const active = [...this.sessions.values()].filter((s) => now - s.lastSeen <= SESSION_TTL_MS);

    const pages = new Map<string, number>();
    for (const s of active) {
      pages.set(s.page, (pages.get(s.page) ?? 0) + 1);
    }
    const topPages = [...pages.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const recentActivity = this.activity.slice(0, 20).map((a) => {
      const seconds = Math.floor((now - a.timestamp) / 1000);
      let timeAgo: string;
      if (seconds < 60) timeAgo = `${seconds}s ago`;
      else if (seconds < 3600) timeAgo = `${Math.floor(seconds / 60)}m ago`;
      else timeAgo = `${Math.floor(seconds / 3600)}h ago`;
      return {
        id: a.id,
        type: a.type,
        label: labelForActivity(a),
        timeAgo,
        page: a.page,
      };
    });

    return { activeVisitors: active.length, topPages, recentActivity };
  }
}

function labelForActivity(a: ActivityItem): string {
  const display = a.title || a.page;
  switch (a.type) {
    case "page_view":
      return `Page viewed: ${display}`;
    case "product_view":
      return `Product viewed: ${display}`;
    case "add_to_cart":
      return `Added to cart: ${a.metadata?.productName || display}`;
    case "checkout_start":
      return "Checkout started";
    case "purchase":
      return "Order completed";
    case "search":
      return `Searched: "${a.metadata?.q || ""}"`;
    default:
      return display;
  }
}

export const liveViewStore = new LiveViewStore();
