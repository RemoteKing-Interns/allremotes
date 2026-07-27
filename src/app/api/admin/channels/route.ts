import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { eBayAdapter } from "@/lib/channels/ebay";
import { getValidCredentials, saveChannelListing, saveChannelOrder, getMarketplaceAccount } from "@/lib/channels/db";
import { getProductSkuForKey } from "@/lib/products-import";
import type { ListingPayload, ChannelOrder } from "@/lib/channels/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadProduct(productId: string) {
  const db = await getDb();
  return db.collection("products").findOne({ id: productId });
}

function buildListingPayload(product: any): ListingPayload {
  const sku = product.sku || getProductSkuForKey(product) || product.id;
  const price = Number(product.price || 0);
  const quantity = Number(product.quantity || product.stock || (product.inStock ? 1 : 0));
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [];
  const title = `${product.brand || "ALLREMOTES"} ${product.model || product.name || sku}`.trim();
  const description =
    product.description?.trim() ||
    `High-quality ${title}. Professional replacement remote with reliable performance.`;

  return {
    sku,
    title,
    description,
    brand: product.brand || "ALLREMOTES",
    condition: product.condition || "Brand New",
    price,
    currency: process.env.DEFAULT_CURRENCY || "AUD",
    quantity,
    images,
    category: product.marketplaceCategory?.ebay,
    mpn: product.mpn,
    gtin: product.gtin,
    packageWeight: product.packageWeight,
    packageDimensions: product.packageDimensions,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const [ebayAccount, listings] = await Promise.all([
      getMarketplaceAccount("ebay"),
      productId
        ? getDb().then((db) =>
            db.collection("channelListings").find({ productId }).toArray()
          )
        : Promise.resolve([]),
    ]);
    return NextResponse.json({
      accounts: { ebay: { connected: ebayAccount?.connected || false, updatedAt: ebayAccount?.updatedAt } },
      listings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load channel data", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const action = String(body?.action || "").trim();
    const channel = String(body?.channel || "").trim() as "ebay";
    const productId = String(body?.productId || "").trim();

    if (!action || !channel) {
      return NextResponse.json({ error: "Missing action or channel" }, { status: 400 });
    }

    if (channel !== "ebay") {
      return NextResponse.json({ error: "Only eBay is supported in this MVP" }, { status: 400 });
    }

    const creds = await getValidCredentials("ebay");

    if (action === "publish") {
      if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
      const product = await loadProduct(productId);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      const payload = buildListingPayload(product);
      const { externalId, externalUrl } = await eBayAdapter.publishListing(payload, creds);
      await saveChannelListing({
        productId,
        sku: payload.sku,
        channel: "ebay",
        externalId,
        externalUrl,
        status: "listed",
        lastSyncedAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, channel: "ebay", externalId, externalUrl });
    }

    if (action === "updateInventory") {
      if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
      const product = await loadProduct(productId);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      const sku = product.sku || getProductSkuForKey(product) || product.id;
      const price = Number(product.price || 0);
      const quantity = Number(product.quantity || product.stock || (product.inStock ? 1 : 0));
      await eBayAdapter.updateInventory(sku, price, quantity, creds);
      return NextResponse.json({ ok: true, channel: "ebay", sku, price, quantity });
    }

    if (action === "syncOrders") {
      const since = new Date(body?.since || Date.now() - 7 * 24 * 60 * 60 * 1000);
      const orders = await eBayAdapter.fetchOrders(since, creds);
      let saved = 0;
      for (const order of orders) {
        await saveChannelOrder(order);
        saved++;
      }
      return NextResponse.json({ ok: true, channel: "ebay", count: saved, orders });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Channel action failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
