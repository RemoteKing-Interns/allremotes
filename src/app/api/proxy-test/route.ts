import { NextResponse } from "next/server";
import { proxyFetch } from "@/lib/proxy-fetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Diagnostic endpoint: reports the outbound IP as seen when going through
 * the static-IP proxy (PROXY_URL env var) vs. a direct fetch.
 *
 * Remove this route once Temu integration is verified.
 */
export async function GET() {
  const proxyUrl = process.env.PROXY_URL;
  const allKeys = Object.keys(process.env).sort();
  const proxyKeys = allKeys.filter((k) => k.toUpperCase().includes("PROXY"));
  const result: {
    proxyConfigured: boolean;
    proxyKeyCount: number;
    proxyKeys: string[];
    proxyUrlLength?: number;
    proxyUrlPrefix?: string;
    proxyOutboundIp?: string;
    directOutboundIp?: string;
    error?: string;
  } = {
    proxyConfigured: !!proxyUrl,
    proxyKeyCount: proxyKeys.length,
    proxyKeys,
    proxyUrlLength: proxyUrl?.length,
    proxyUrlPrefix: proxyUrl ? proxyUrl.slice(0, 30) : undefined,
  };

  try {
    const proxyRes = await proxyFetch("https://api.ipify.org?format=json");
    if (proxyRes.ok) {
      const j = (await proxyRes.json()) as { ip?: string };
      result.proxyOutboundIp = j.ip;
    } else {
      result.error = `proxy fetch status ${proxyRes.status}`;
    }
  } catch (e) {
    result.error = `proxy fetch failed: ${(e as Error).message}`;
  }

  try {
    const directRes = await fetch("https://api.ipify.org?format=json");
    if (directRes.ok) {
      const j = (await directRes.json()) as { ip?: string };
      result.directOutboundIp = j.ip;
    }
  } catch {
    // direct fetch failure is non-fatal
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
