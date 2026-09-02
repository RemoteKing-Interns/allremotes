import { HttpsProxyAgent } from "https-proxy-agent";

let _agent: HttpsProxyAgent<string> | null = null;

/**
 * Returns a shared HttpsProxyAgent configured from PROXY_URL env var.
 * Use when calling external APIs that require a static outbound IP
 * (e.g., Temu Open API IP whitelist).
 *
 * Returns null if PROXY_URL is not set, so callers can fall back to
 * a direct fetch in dev/preview environments.
 *
 * Usage:
 *   const res = await fetch(url, { agent: getProxyAgent() ?? undefined });
 */
export function getProxyAgent(): HttpsProxyAgent<string> | null {
  if (_agent) return _agent;
  const url = process.env.PROXY_URL;
  if (!url) return null;
  _agent = new HttpsProxyAgent(url);
  return _agent;
}

/**
 * fetch wrapper that routes through the static-IP proxy when PROXY_URL is set.
 * Falls back to global fetch when not configured.
 */
export async function proxyFetch(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const agent = getProxyAgent();
  if (!agent) return fetch(input, init);
  // Node fetch (undici) accepts `agent` via dispatcher, but Next.js runtime
  // supports the node-fetch-compatible `agent` option on RequestInit.
  return fetch(input as string, { ...init, agent } as any);
}
