import crypto from "crypto";

let tokenCache: { token: string; expiresAt: number } | null = null;

function credentials() {
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON || process.env.GSC_SERVICE_ACCOUNT_JSON;
  const file = process.env.GA4_SERVICE_ACCOUNT_FILE || process.env.GSC_SERVICE_ACCOUNT_FILE;
  let json = raw;
  if (!json && file) json = require("fs").readFileSync(file, "utf8");
  if (!json) throw new Error("GA4 credentials not configured. Set GA4_SERVICE_ACCOUNT_JSON or reuse GSC_SERVICE_ACCOUNT_JSON.");
  const parsed = JSON.parse(json);
  if (!parsed.client_email || !parsed.private_key) throw new Error("Invalid GA4 service account credentials");
  return parsed;
}

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt > now + 60) return tokenCache.token;
  const sa = credentials();
  const encode = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const input = `${encode({ alg: "RS256", typ: "JWT", kid: sa.private_key_id })}.${encode({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(input);
  const jwt = `${input}.${sign.sign(sa.private_key, "base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GA4 authentication failed: ${data.error_description || data.error}`);
  tokenCache = { token: data.access_token, expiresAt: now + Number(data.expires_in || 3600) };
  return tokenCache.token;
}

async function report(body: Record<string, unknown>, realtime = false) {
  const property = process.env.GA4_PROPERTY_ID;
  if (!property) throw new Error("GA4_PROPERTY_ID is not configured");
  const method = realtime ? "runRealtimeReport" : "runReport";
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:${method}`, {
    method: "POST",
    headers: { authorization: `Bearer ${await accessToken()}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GA4 report failed: ${data.error?.message || res.status}`);
  return data;
}

function rows(data: any) {
  return (data.rows || []).map((row: any) => ({
    dimensions: (row.dimensionValues || []).map((v: any) => v.value),
    metrics: (row.metricValues || []).map((v: any) => Number(v.value || 0)),
  }));
}

export async function getGA4Dashboard(days: number) {
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];
  const [summary, pages, sources, devices, countries, funnel] = await Promise.all([
    report({ dateRanges, metrics: ["activeUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration", "newUsers"].map((name) => ({ name })) }),
    report({ dateRanges, dimensions: [{ name: "pagePath" }, { name: "pageTitle" }], metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "averageEngagementTime" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 20 }),
    report({ dateRanges, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 15 }),
    report({ dateRanges, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }] }),
    report({ dateRanges, dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 15 }),
    report({ dateRanges, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["view_item", "add_to_cart", "begin_checkout", "purchase"] } } } }),
  ]);
  return { summary: rows(summary)[0]?.metrics || [], pages: rows(pages), sources: rows(sources), devices: rows(devices), countries: rows(countries), funnel: rows(funnel) };
}
