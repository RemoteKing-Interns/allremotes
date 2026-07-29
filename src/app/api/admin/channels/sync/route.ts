import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/channels";
import { getChannelListings, getValidCredentials, saveChannelListing, saveChannelOrder } from "@/lib/channels/db";
import { withRetry } from "@/lib/channels/retry";
import type { Marketplace } from "@/lib/channels/core";
import { getDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function syncInventory(channel: Marketplace, since?: Date) {
  const creds = await getValidCredentials(channel);
  const listings = await getChannelListings();
  const results = [];
  for (const listing of listings) {
    if (listing.channel !== channel || !listing.externalId) continue;
    try {
      const db = await getDb();
      const product = await db.collection("products").findOne({ id: listing.productId });
      if (!product) continue;
      const price = Number(product.price || 0);
      const quantity = Number(product.quantity || product.stock || (product.inStock ? 1 : 0));
      await withRetry(() => getAdapter(channel).updateInventory(listing.sku, price, quantity, creds));
      await saveChannelListing({ ...listing, lastSyncedAt: new Date().toISOString() });
      results.push({ productId: listing.productId, sku: listing.sku, ok: true });
    } catch (err: any) {
      results.push({ productId: listing.productId, sku: listing.sku, ok: false, error: err?.message || String(err) });
    }
  }
  return results;
}

async function syncOrders(channel: Marketplace, since?: Date) {
  const creds = await getValidCredentials(channel);
  const orders = await withRetry(() => getAdapter(channel).fetchOrders(since || new Date(Date.now() - 24 * 60 * 60 * 1000), creds));
  let saved = 0;
  for (const order of orders) {
    await saveChannelOrder(order);
    saved++;
  }
  return { count: saved, orders };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = (searchParams.get("channel") || "ebay") as Marketplace;
  const action = searchParams.get("action") || "orders";
  const since = searchParams.get("since") ? new Date(searchParams.get("since")!) : undefined;

  try {
    if (action === "inventory") {
      const results = await syncInventory(channel, since);
      return NextResponse.json({ ok: true, channel, action, results });
    }
    if (action === "orders") {
      const result = await syncOrders(channel, since);
      return NextResponse.json({ ok: true, channel, action, ...result });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Sync failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const channel = (body.channel || "ebay") as Marketplace;
  const action = body.action || "orders";
  const since = body.since ? new Date(body.since) : undefined;

  try {
    if (action === "inventory") {
      const results = await syncInventory(channel, since);
      return NextResponse.json({ ok: true, channel, action, results });
    }
    if (action === "orders") {
      const result = await syncOrders(channel, since);
      return NextResponse.json({ ok: true, channel, action, ...result });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Sync failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
