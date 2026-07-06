import { NextResponse } from "next/server";
import crypto from "crypto";
import { mongoEnabled, getDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNLEASHED_BASE = "https://api.unleashedsoftware.com";

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

// Fetch stock for a single product code from Unleashed /StockOnHand endpoint
async function fetchProductStock(apiId: string, apiKey: string, productCode: string): Promise<number | null> {
  const qs = `productCode=${encodeURIComponent(productCode)}&pageSize=1`;
  const res = await fetch(`${UNLEASHED_BASE}/StockOnHand?${qs}`, {
    headers: unleashedHeaders(apiId, apiKey, qs),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const item = data?.Items?.[0];
  if (!item) return null;
  return item.QtyOnHand ?? item.AvailableQty ?? null;
}

export async function POST(request: Request) {
  const apiId = process.env.UNLEASHED_API_ID;
  const apiKey = process.env.UNLEASHED_API_KEY;

  if (!apiId || !apiKey) {
    return NextResponse.json({ error: "Unleashed credentials not configured" }, { status: 503 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // items: [{ rk_sku: string, sku: string, name: string, sellingQty: number }]
  // orderIds: string[] — order IDs in this group, used to persist stockSnapshot
  let items: { rk_sku: string; sku: string; name: string; sellingQty: number }[] = body?.items || [];
  const orderIds: string[] = body?.orderIds || [];
  if (!items.length) return NextResponse.json({ error: "No items provided" }, { status: 400 });

  // For items missing rk_sku, look it up from MongoDB by sku or name
  const needsLookup = items.filter((i) => !i.rk_sku);
  if (needsLookup.length > 0 && mongoEnabled()) {
    try {
      const db = await getDb();
      const skus = needsLookup.map((i) => i.sku).filter(Boolean);
      const names = needsLookup.filter((i) => !i.sku).map((i) => i.name).filter(Boolean);

      const query: any[] = [];
      if (skus.length) query.push({ sku: { $in: skus } });
      if (names.length) query.push({ name: { $in: names } });

      if (query.length > 0) {
        const products = await db.collection("products").find(
          { $or: query },
          { projection: { sku: 1, name: 1, rk_sku: 1 } }
        ).toArray();

        const rkSkuBySku: Record<string, string> = {};
        const rkSkuByName: Record<string, string> = {};
        products.forEach((p: any) => {
          if (p.sku && p.rk_sku) rkSkuBySku[p.sku] = p.rk_sku;
          if (p.name && p.rk_sku) rkSkuByName[p.name] = p.rk_sku;
        });

        items = items.map((i) => {
          if (i.rk_sku) return i;
          const found = (i.sku && rkSkuBySku[i.sku]) || (i.name && rkSkuByName[i.name]) || "";
          return found ? { ...i, rk_sku: found } : i;
        });
      }
    } catch {
      // Non-fatal
    }
  }

  // Fetch stock for each rk_sku in parallel
  const stockResults = await Promise.all(
    items.map(async (item) => {
      const code = item.rk_sku || item.sku;
      if (!code) return { rk_sku: item.rk_sku, sku: item.sku, name: item.name, productCode: "", unleashedQty: null, newStock: null };
      const unleashedQty = await fetchProductStock(apiId, apiKey, code);
      const newStock = unleashedQty !== null ? Math.max(0, unleashedQty - (item.sellingQty || 0)) : null;
      // productCode is the enriched code actually used for lookup (rk_sku after DB enrichment)
      return { rk_sku: item.rk_sku, sku: item.sku, name: item.name, productCode: code, unleashedQty, newStock };
    })
  );

  if (mongoEnabled()) {
    try {
      const db = await getDb();

      // 1. Update products collection with new stock levels
      await Promise.all(
        stockResults
          .filter((r) => r.newStock !== null && (r.sku || r.name))
          .map((r) => {
            const filter = r.sku ? { sku: r.sku } : { name: r.name };
            return db.collection("products").updateOne(
              filter,
              {
                $set: {
                  stock: r.newStock,
                  inStock: (r.newStock ?? 0) >= 1,
                  updatedAt: new Date().toISOString(),
                },
              }
            );
          })
      );

      // 2. Build stockSnapshot map (productCode → unleashedQty) and persist on each order
      if (orderIds.length > 0) {
        const stockSnapshot: Record<string, number | null> = {};
        stockResults.forEach((r) => {
          if (r.productCode) stockSnapshot[r.productCode] = r.unleashedQty;
          if (r.sku) stockSnapshot[r.sku] = r.unleashedQty;
        });
        await db.collection("orders").updateMany(
          { id: { $in: orderIds } },
          { $set: { stockSnapshot, stockSnapshotAt: new Date().toISOString() } }
        );
      }
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({ results: stockResults });
}
