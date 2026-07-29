import { getAdapter, type ListingPayload } from "@/lib/channels";
import { getValidCredentials, saveChannelListing, saveChannelOrder, getMarketplaceAccount, getChannelListings } from "@/lib/channels/db";
import { getProductSkuForKey } from "@/lib/products-import";
import { toPublicImageUrls } from "@/lib/channels/images";
import type { ChannelOrder, Marketplace } from "@/lib/channels/core";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

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
  const images = toPublicImageUrls(
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : []
  );
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
    const productId = searchParams.get("productId") || undefined;
    const [ebayAccount, listings] = await Promise.all([
      getMarketplaceAccount("ebay"),
      getChannelListings(productId),
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

async function pushToChannel(channel: Marketplace, productId: string, fields: string[]) {
  const product = await loadProduct(productId);
  if (!product) throw new Error(`Product ${productId} not found`);
  const payload = buildListingPayload(product);
  const creds = await getValidCredentials(channel);

  const existing = await getChannelListings(productId).then((list) =>
    list.find((l) => l.channel === channel && l.externalId)
  );

  const onlyInventory =
    fields.length === 2 &&
    fields.includes("price") &&
    fields.includes("quantity");

  if (existing && onlyInventory) {
    await getAdapter(channel).updateInventory(payload.sku, payload.price, payload.quantity, creds);
    await saveChannelListing({
      productId,
      sku: payload.sku,
      channel,
      externalId: existing.externalId,
      externalUrl: existing.externalUrl,
      status: "listed",
      lastSyncedAt: new Date().toISOString(),
    });
    return { productId, channel, externalId: existing.externalId, mode: "inventory" };
  }

  if (existing && getAdapter(channel).updateListing) {
    const { externalId, externalUrl } = await getAdapter(channel).updateListing(existing.externalId, payload, creds);
    await saveChannelListing({
      productId,
      sku: payload.sku,
      channel,
      externalId,
      externalUrl: externalUrl || existing.externalUrl,
      status: "listed",
      lastSyncedAt: new Date().toISOString(),
    });
    return { productId, channel, externalId, mode: "update" };
  }

  const { externalId, externalUrl } = await getAdapter(channel).publishListing(payload, creds);
  await saveChannelListing({
    productId,
    sku: payload.sku,
    channel,
    externalId,
    externalUrl,
    status: "listed",
    lastSyncedAt: new Date().toISOString(),
  });
  return { productId, channel, externalId, externalUrl, mode: "publish" };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const action = String(body?.action || "").trim();
    const channels: Marketplace[] = Array.isArray(body?.channels) ? body.channels : ["ebay"];
    const fields: string[] = Array.isArray(body?.fields) && body.fields.length > 0
      ? body.fields
      : ["title", "description", "price", "quantity", "condition", "images"];
    const productId = String(body?.productId || "").trim();
    const productIds: string[] = Array.isArray(body?.productIds) ? body.productIds : (productId ? [productId] : []);

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    if (action === "push") {
      if (productIds.length === 0) {
        return NextResponse.json({ error: "Missing productId or productIds" }, { status: 400 });
      }
      const results = [];
      for (const id of productIds) {
        for (const channel of channels) {
          try {
            const result = await pushToChannel(channel, id, fields);
            results.push({ ok: true, ...result });
          } catch (err: any) {
            results.push({ ok: false, productId: id, channel, error: err?.message || String(err) });
          }
        }
      }
      return NextResponse.json({ ok: true, results });
    }

    if (action === "publish") {
      if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
      const product = await loadProduct(productId);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      const payload = buildListingPayload(product);
      const channel: Marketplace = body?.channel || "ebay";
      const creds = await getValidCredentials(channel);
      const { externalId, externalUrl } = await getAdapter(channel).publishListing(payload, creds);
      await saveChannelListing({
        productId,
        sku: payload.sku,
        channel,
        externalId,
        externalUrl,
        status: "listed",
        lastSyncedAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, channel, externalId, externalUrl });
    }

    if (action === "updateInventory") {
      if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
      const product = await loadProduct(productId);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      const sku = product.sku || getProductSkuForKey(product) || product.id;
      const price = Number(product.price || 0);
      const quantity = Number(product.quantity || product.stock || (product.inStock ? 1 : 0));
      const channel: Marketplace = body?.channel || "ebay";
      const creds = await getValidCredentials(channel);
      await getAdapter(channel).updateInventory(sku, price, quantity, creds);
      return NextResponse.json({ ok: true, channel, sku, price, quantity });
    }

    if (action === "syncOrders") {
      const channel: Marketplace = body?.channel || "ebay";
      const creds = await getValidCredentials(channel);
      const since = new Date(body?.since || Date.now() - 7 * 24 * 60 * 60 * 1000);
      const orders = await getAdapter(channel).fetchOrders(since, creds);
      let saved = 0;
      for (const order of orders) {
        await saveChannelOrder(order);
        saved++;
      }
      return NextResponse.json({ ok: true, channel, count: saved, orders });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Channel action failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
