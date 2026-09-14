import { ProxyAgent, fetch as undiciFetch } from "undici";

let _dispatcher: ProxyAgent | null = null;

/**
 * Returns a shared undici ProxyAgent configured from PROXY_URL env var.
 * Use when calling external APIs that require a static outbound IP
 * (e.g., Temu Open API IP whitelist).
 *
 * Returns null if PROXY_URL is not set, so callers can fall back to
 * a direct fetch in dev/preview environments.
 */
export function getProxyDispatcher(): ProxyAgent | null {
  if (_dispatcher) return _dispatcher;
  const url = process.env.PROXY_URL;
  if (!url) return null;
  _dispatcher = new ProxyAgent({ uri: url });
  return _dispatcher;
}

/**
 * fetch wrapper that routes through the static-IP proxy when PROXY_URL is set.
 * Uses undici's dispatcher option (native fetch in Node 18+).
 * Falls back to global fetch when not configured.
 */
export async function proxyFetch(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const dispatcher = getProxyDispatcher();
  if (!dispatcher) return fetch(input, init);
  // Use undici's own fetch (not the global) so the dispatcher option is honored.
  return undiciFetch(input as string, { ...init, dispatcher } as any) as unknown as Promise<Response>;
}
