"use client";

// Lightweight fire-and-forget activity logger for client-side admin events.
// Batches events and flushes every 3s or when the buffer hits 10 entries.

interface ActivityEntry {
  action: string;
  level?: "info" | "warn" | "error";
  details?: Record<string, any>;
  userEmail?: string;
  userId?: string;
  route?: string;
}

class ActivityLogger {
  private buffer: ActivityEntry[] = [];
  private maxBuffer = 10;
  private flushMs = 3000;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private userEmail = "";
  private userId = "";

  setUser(email: string, id?: string) {
    this.userEmail = email;
    this.userId = id || "";
  }

  log(action: string, details?: Record<string, any>, level: ActivityEntry["level"] = "info") {
    this.buffer.push({
      action,
      level,
      details,
      userEmail: this.userEmail,
      userId: this.userId,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
    });

    if (this.buffer.length >= this.maxBuffer) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushMs);
    }
  }

  /** Log a page/tab view */
  pageView(page: string, details?: Record<string, any>) {
    this.log("page_view", { page, ...details });
  }

  /** Log an explicit admin action (save, delete, export, etc.) */
  action(name: string, details?: Record<string, any>) {
    this.log(`action:${name}`, details);
  }

  /** Log an error / failed operation */
  error(name: string, details?: Record<string, any>) {
    this.log(`error:${name}`, details, "error");
  }

  private async flush() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: entries.map(e => ({ ...e, timestamp: new Date() })) }),
        // Use keepalive so the request isn't killed when navigating away
        keepalive: true,
      });
    } catch {
      // silently discard — logging should never break the app
    }
  }

  /** Call on unmount / page unload to ensure pending events are sent */
  flushSync() {
    if (this.buffer.length === 0) return;
    const entries = [...this.buffer];
    this.buffer = [];
    // Use sendBeacon when available for reliable unload delivery
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/admin/logs",
        new Blob([JSON.stringify({ logs: entries.map(e => ({ ...e, timestamp: new Date() })) })], {
          type: "application/json",
        })
      );
    }
  }
}

export const activityLogger = new ActivityLogger();
