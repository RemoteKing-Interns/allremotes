import { NextResponse } from "next/server";
import crypto from "crypto";
import { mongoEnabled, getDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNLEASHED_BASE = "https://api.unleashedsoftware.com";
const CONCURRENCY = 5;

function signRequest(apiKey: string, queryString: string): string {
  return crypto.createHmac("sha256", apiKey).update(queryString).digest("base64");
}

function unleashedHeaders(apiId: string, apiKey: string, queryString = "") {
  return {
    Accept: "application/json",
    "api-auth-id": apiId,
    "api-auth-signature": signRequest(apiKey, queryString),
  };
}

async function fetchProductStock(apiId: string, apiKey: string, productCode: string): Promise<number | null> {
  const qs = `productCode=${encodeURIComponent(productCode)}&pageSize=1&warehouse=RKW1`;
  const res = await fetch(`${UNLEASHED_BASE}/StockOnHand?${qs}`, {
    headers: unleashedHeaders(apiId, apiKey, qs),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const item = data?.Items?.[0];
  if (!item) return null;
  return item.QtyOnHand ?? item.AvailableQty ?? null;
}

async function runWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function POST() {
  const apiId = process.env.UNLEASHED_API_ID;
  const apiKey = process.env.UNLEASHED_API_KEY;

  if (!apiId || !apiKey) {
    return NextResponse.json({ error: "Unleashed credentials not configured" }, { status: 503 });
  }

  if (!mongoEnabled()) {
    return NextResponse.json({ error: "MongoDB not enabled" }, { status: 503 });
  }

  try {
    const db = await getDb();

    const today = new Date().toLocaleDateString("en-AU", { timeZone: "Australia/Melbourne" });

    const meta = await db.collection("inventorySyncMeta").findOne({ type: "dailySync" });
    if (meta?.lastSyncDate === today) {
      return NextResponse.json({ ok: true, skipped: true, lastSyncDate: today });
    }

    await db.collection("inventorySyncMeta").updateOne(
      { type: "dailySync" },
      { $set: { type: "dailySync", lastSyncDate: today, syncStartedAt: new Date().toISOString() } },
      { upsert: true }
    );

    const products = await db
      .collection("products")
      .find({ rk_sku: { $exists: true, $ne: "" } }, { projection: { _id: 1, rk_sku: 1 } })
      .toArray();

    let synced = 0;
    let failed = 0;

    await runWithConcurrency(products as any[], CONCURRENCY, async (product: any) => {
      const qty = await fetchProductStock(apiId, apiKey, product.rk_sku);
      if (qty !== null) {
        await db.collection("products").updateOne(
          { _id: product._id },
          { $set: { stock: qty, inStock: qty >= 1, updatedAt: new Date().toISOString() } }
        );
        synced++;
      } else {
        failed++;
      }
    });

    await db.collection("inventorySyncMeta").updateOne(
      { type: "dailySync" },
      { $set: { lastSyncDate: today, syncCompletedAt: new Date().toISOString(), synced, failed } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, synced, failed, lastSyncDate: today });
  } catch (error: any) {
    console.error("Error in daily inventory sync:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync inventory" },
      { status: 500 }
    );
  }
}
