import { NextResponse } from "next/server";
import crypto from "crypto";

const UNLEASHED_BASE = "https://api.unleashedsoftware.com";

function signRequest(apiKey: string, queryString: string): string {
  return crypto.createHmac("sha256", apiKey).update(queryString).digest("base64");
}

export async function GET(request: Request) {
  const apiId = process.env.UNLEASHED_API_ID;
  const apiKey = process.env.UNLEASHED_API_KEY;

  if (!apiId || !apiKey) {
    return NextResponse.json({ error: "Credentials not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const queryString = `pageSize=20${search ? `&productCode=${encodeURIComponent(search)}` : ""}`;
  const url = `${UNLEASHED_BASE}/Products?${queryString}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": signRequest(apiKey, queryString),
    },
  });

  const data = await res.json().catch(() => null);
  // Return just the product codes for easy reading
  const items = (data?.Items || []).map((p: any) => ({
    ProductCode: p.ProductCode,
    ProductDescription: p.ProductDescription,
    Guid: p.Guid,
  }));
  return NextResponse.json({ items, total: data?.Pagination?.NumberOfItems });
}
