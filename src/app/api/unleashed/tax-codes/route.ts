import { NextResponse } from "next/server";
import crypto from "crypto";

const UNLEASHED_BASE = "https://api.unleashedsoftware.com";

function signRequest(apiKey: string, queryString: string): string {
  return crypto.createHmac("sha256", apiKey).update(queryString).digest("base64");
}

export async function GET() {
  const apiId = process.env.UNLEASHED_API_ID;
  const apiKey = process.env.UNLEASHED_API_KEY;

  if (!apiId || !apiKey) {
    return NextResponse.json({ error: "Credentials not configured" }, { status: 503 });
  }

  const queryString = "pageSize=200";
  const url = `${UNLEASHED_BASE}/Taxes?${queryString}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": signRequest(apiKey, queryString),
    },
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
