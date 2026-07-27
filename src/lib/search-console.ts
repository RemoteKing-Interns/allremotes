import crypto from "crypto";

/**
 * Google Search Console API helper.
 *
 * Authenticates with a service account using a self-signed JWT (no external
 * dependency needed) and caches the access token until it expires.
 *
 * Required env vars:
 *   GSC_SITE_URL            – e.g. "sc-domain:allremotes.com.au" or "https://www.allremotes.com.au/"
 *   GSC_SERVICE_ACCOUNT_JSON – raw JSON string of the service account key file
 *   (or)
 *   GSC_SERVICE_ACCOUNT_FILE – absolute path to the JSON key file
 */

// ── Types ────────────────────────────────────────────────────────────────────
interface ServiceAccount {
  client_email: string;
  private_key: string;
  private_key_id?: string;
}

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface GSCQueryParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions?: string[]; // e.g. ["query"], ["page"], ["date"], ["country"], ["device"]
  rowLimit?: number; // 1–25000
  type?: "web" | "image" | "video" | "news" | "discover";
}

export interface GSCSummary {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  rows: SearchAnalyticsRow[];
}

// ── Service account loading ──────────────────────────────────────────────────
let saCache: ServiceAccount | null = null;

function loadServiceAccount(): ServiceAccount {
  if (saCache) return saCache;

  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const filePath = process.env.GSC_SERVICE_ACCOUNT_FILE;

  let json: string | undefined;
  if (raw) {
    json = raw;
  } else if (filePath) {
    try {
      json = require("fs").readFileSync(filePath, "utf-8");
    } catch {
      throw new Error("GSC_SERVICE_ACCOUNT_FILE not readable: " + filePath);
    }
  }

  if (!json) {
    throw new Error(
      "Missing Google Search Console credentials. Set GSC_SERVICE_ACCOUNT_JSON or GSC_SERVICE_ACCOUNT_FILE."
    );
  }

  const parsed = JSON.parse(json) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Invalid service account JSON: missing client_email or private_key");
  }
  saCache = parsed;
  return parsed;
}

// ── JWT-based OAuth 2.0 token ────────────────────────────────────────────────
let tokenCache: { token: string; expiresAt: number } | null = null;

function base64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.token;
  }

  const sa = loadServiceAccount();
  const header = { alg: "RS256", typ: "JWT", kid: sa.private_key_id };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signInput);
  const signature = sign.sign(sa.private_key, "base64url");

  const jwt = `${signInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to get GSC access token: ${tokenRes.status} ${errText}`);
  }

  const tokenData = await tokenRes.json() as { access_token: string; expires_in: number };
  tokenCache = {
    token: tokenData.access_token,
    expiresAt: now + tokenData.expires_in,
  };
  return tokenCache.token;
}

// ── Search Analytics query ───────────────────────────────────────────────────
function getSiteUrl(): string {
  const url = process.env.GSC_SITE_URL;
  if (!url) throw new Error("GSC_SITE_URL env var not set");
  return url;
}

export async function querySearchAnalytics(params: GSCQueryParams): Promise<GSCSummary> {
  const token = await getAccessToken();
  const siteUrl = encodeURIComponent(getSiteUrl());

  const body = {
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: params.dimensions ?? ["query"],
    type: params.type ?? "web",
    rowLimit: params.rowLimit ?? 1000,
  };

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Search Console API error: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as SearchAnalyticsResponse;
  const rows = data.rows ?? [];

  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPosition =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / Math.max(1, totalImpressions)
      : 0;

  return { totalClicks, totalImpressions, avgCtr, avgPosition, rows };
}

// ── Server-side in-memory cache ──────────────────────────────────────────────
// Ponytail: single-process Map cache. Fine for one Node instance; upgrade to
// Redis if you scale to multiple instances.
const cache = new Map<string, { data: GSCSummary; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function getCachedSearchAnalytics(params: GSCQueryParams): Promise<GSCSummary> {
  const key = JSON.stringify(params);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const data = await querySearchAnalytics(params);
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

export function isSearchConsoleConfigured(): boolean {
  try {
    return Boolean(process.env.GSC_SITE_URL && (process.env.GSC_SERVICE_ACCOUNT_JSON || process.env.GSC_SERVICE_ACCOUNT_FILE));
  } catch {
    return false;
  }
}
