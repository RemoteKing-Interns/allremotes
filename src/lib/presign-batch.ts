/**
 * Client-side batch pre-sign utility for S3 URLs.
 * Collects keys from multiple ProductImage components and sends them
 * in a single POST request, reducing N API calls to 1.
 * Also caches signed URLs for 6 days (URLs expire in 7).
 */

const CACHE_TTL = 6 * 24 * 60 * 60 * 1000; // 6 days
const cache = new Map<string, { url: string; expires: number }>();
const pending = new Map<string, ((url: string | null) => void)[]>();
let timer: ReturnType<typeof setTimeout> | null = null;

export function batchPresign(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.url);
  }

  return new Promise((resolve) => {
    const existing = pending.get(key);
    if (existing) {
      existing.push(resolve);
    } else {
      pending.set(key, [resolve]);
    }

    if (!timer) {
      timer = setTimeout(flush, 5);
    }
  });
}

async function flush() {
  timer = null;
  const keys = Array.from(pending.keys());
  const resolvers = Array.from(pending.values());
  pending.clear();

  if (keys.length === 0) return;

  try {
    const res = await fetch("/api/s3-presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
    });
    const data = await res.json();
    const urls: Record<string, string> = data.urls || {};

    for (let i = 0; i < keys.length; i++) {
      const url = urls[keys[i]] || null;
      if (url) {
        cache.set(keys[i], { url, expires: Date.now() + CACHE_TTL });
      }
      resolvers[i].forEach((r) => r(url));
    }
  } catch {
    resolvers.forEach((group) => group.forEach((r) => r(null)));
  }
}
