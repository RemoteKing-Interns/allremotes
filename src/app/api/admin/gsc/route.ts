import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createJwt(serviceAccount: { client_email: string; private_key: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const token = `${base64Url(header)}.${base64Url(payload)}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(token);
  const signature = signer.sign(serviceAccount.private_key, "base64url");
  return `${token}.${signature}`;
}

async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const jwt = createJwt(serviceAccount);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

export async function GET() {
  const siteUrl = process.env.GSC_SITE_URL;
  const keyFile = process.env.GSC_SERVICE_ACCOUNT_FILE;

  if (!siteUrl || !keyFile) {
    return NextResponse.json(
      { error: "GSC credentials not configured. Set GSC_SITE_URL and GSC_SERVICE_ACCOUNT_FILE in .env.local" },
      { status: 503 }
    );
  }

  let serviceAccount: { client_email: string; private_key: string };
  try {
    const raw = fs.readFileSync(keyFile, "utf-8");
    serviceAccount = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: `Service account file not found at ${keyFile}. Download it from Google Cloud Console → IAM → Service Accounts → Keys.` },
      { status: 503 }
    );
  }

  try {
    const token = await getAccessToken(serviceAccount);
    const encodedSite = encodeURIComponent(siteUrl);

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);

    const [queryRes, pageRes] = await Promise.all([
      fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ["query"],
            rowLimit: 100,
          }),
        }
      ),
      fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ["page"],
            rowLimit: 50,
          }),
        }
      ),
    ]);

    const queryData = await queryRes.json();
    const pageData = await pageRes.json();

    const queries = (queryData.rows || []).map((r: any) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));

    const pages = (pageData.rows || []).map((r: any) => ({
      url: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));

    const quickWins = queries
      .filter((q: any) => q.position >= 8 && q.position <= 20)
      .sort((a: any, b: any) => b.impressions - a.impressions)
      .slice(0, 20);

    return NextResponse.json({
      ok: true,
      dateRange: { startDate, endDate },
      queries: queries.sort((a: any, b: any) => b.clicks - a.clicks),
      pages: pages.sort((a: any, b: any) => b.clicks - a.clicks),
      quickWins,
      summary: {
        totalQueries: queries.length,
        totalClicks: queries.reduce((s: number, q: any) => s + q.clicks, 0),
        totalImpressions: queries.reduce((s: number, q: any) => s + q.impressions, 0),
        avgPosition: queries.length
          ? (queries.reduce((s: number, q: any) => s + q.position, 0) / queries.length).toFixed(1)
          : null,
      },
    });
  } catch (error: any) {
    console.error("GSC API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch GSC data" },
      { status: 500 }
    );
  }
}
