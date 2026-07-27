"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SESSION_KEY = "allremotes_session_id";
const HEARTBEAT_MS = 15000;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getDeviceType(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function track(type: "heartbeat" | "page_view" | "product_view" | "add_to_cart" | "checkout_start" | "purchase" | "search", path: string, title?: string, metadata?: Record<string, any>) {
  const sessionId = getSessionId();
  if (!sessionId) return;

  const payload = JSON.stringify({
    sessionId,
    type,
    page: path,
    title: title || document.title,
    device: getDeviceType(),
    metadata,
  });

  try {
    if (type === "heartbeat" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
    }
  } catch {
    // ignore
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("page_view", pathname, document.title);
  }, [pathname]);

  useEffect(() => {
    const id = setInterval(() => {
      const path = lastPath.current || window.location.pathname;
      track("heartbeat", path, document.title);
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}

// Global helper so other components can fire events without importing hooks.
if (typeof window !== "undefined") {
  (window as any).trackEvent = (
    type: "product_view" | "add_to_cart" | "checkout_start" | "purchase" | "search",
    path: string,
    title?: string,
    metadata?: Record<string, any>
  ) => track(type, path || window.location.pathname, title, metadata);
}
