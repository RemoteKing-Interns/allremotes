import { NextResponse } from "next/server";
import { getValidCredentials } from "@/lib/channels/db";
import { eBayAdapter } from "@/lib/channels/ebay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ebayDelete(path: string, accessToken: string) {
  const res = await fetch(`${process.env.EBAY_API_URL || "https://api.ebay.com"}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Language": "en-US",
    },
  });
  if (res.status === 204) return { ok: true };
  const text = await res.text();
  if (!res.ok) throw new Error(`eBay DELETE ${path} failed ${res.status}: ${text}`);
  return { ok: true };
}

async function ebayGet(path: string, accessToken: string) {
  const res = await fetch(`${process.env.EBAY_API_URL || "https://api.ebay.com"}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Language": "en-US",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`eBay GET ${path} failed ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get("sku") || "";
  const offerId = searchParams.get("offerId") || "";
  const action = searchParams.get("action") || "";

  try {
    const creds = await getValidCredentials("ebay");
    const results: any = {};

    if (action === "getInventory" || sku) {
      results.inventoryItem = await ebayGet(
        `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
        creds.accessToken
      );
    }

    if (action === "getOffer" || offerId) {
      results.offer = await ebayGet(
        `/sell/inventory/v1/offer/${offerId}`,
        creds.accessToken
      );
    }

    if (action === "getOffers") {
      results.offers = await ebayGet(`/sell/inventory/v1/offer?limit=100`, creds.accessToken);
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: "eBay lookup failed", details: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get("sku") || "";
  const offerId = searchParams.get("offerId") || "";

  if (!sku && !offerId) {
    return NextResponse.json({ error: "Missing sku or offerId" }, { status: 400 });
  }

  try {
    const creds = await getValidCredentials("ebay");
    const results: any = {};

    if (offerId) {
      results.offer = await ebayDelete(`/sell/inventory/v1/offer/${offerId}`, creds.accessToken);
    }

    if (sku) {
      results.inventory = await ebayDelete(
        `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
        creds.accessToken
      );
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: "eBay cleanup failed", details: err?.message || String(err) }, { status: 500 });
  }
}
