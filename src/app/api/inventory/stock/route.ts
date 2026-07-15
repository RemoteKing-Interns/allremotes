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

// Fetch stock from StockOnHand endpoint
async function fetchQuantity(apiId: string, apiKey: string, productCode: string): Promise<number | null> {
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

// Fetch bin location from Products endpoint
async function fetchBinLocation(apiId: string, apiKey: string, productCode: string): Promise<string | null> {
  const qs = `productCode=${encodeURIComponent(productCode)}`;
  const res = await fetch(`${UNLEASHED_BASE}/Products?${qs}`, {
    headers: unleashedHeaders(apiId, apiKey, qs),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const product = data?.Items?.[0];
  if (!product) return null;
  
  const inventoryDetail = product.InventoryDetails?.find((d: any) => d.Warehouse?.WarehouseCode === 'RKW1') ?? product.InventoryDetails?.[0];
  return inventoryDetail?.BinLocation ?? null;
}

// Fetch both stock and bin location
async function fetchProductStock(apiId: string, apiKey: string, productCode: string): Promise<{ quantity: number | null; binLocation: string | null }> {
  const [quantity, binLocation] = await Promise.all([
    fetchQuantity(apiId, apiKey, productCode),
    fetchBinLocation(apiId, apiKey, productCode),
  ]);
  
  console.log(`${productCode}: qty=${quantity}, bin=${binLocation}`);
  return { quantity, binLocation };
}

export async function POST(request: Request) {
  const apiId = process.env.UNLEASHED_API_ID;
  const apiKey = process.env.UNLEASHED_API_KEY;

  if (!apiId || !apiKey) {
    return NextResponse.json({ error: "Unleashed credentials not configured" }, { status: 503 });
  }

  if (!mongoEnabled()) {
    return NextResponse.json({ error: "MongoDB not enabled" }, { status: 503 });
  }

  try {
    const { id, rk_sku } = await request.json();
    if (!id && !rk_sku) {
      return NextResponse.json({ error: "Product id or RK SKU is required" }, { status: 400 });
    }

    const db = await getDb();
    const product = await db.collection("products").findOne(
      id ? { id } : { rk_sku },
      { projection: { _id: 1, id: 1, sku: 1, name: 1, rk_sku: 1, image: 1 } }
    );

    if (!product?.rk_sku) {
      return NextResponse.json({ error: "Product with an RK SKU was not found" }, { status: 404 });
    }

    const { quantity, binLocation } = await fetchProductStock(apiId, apiKey, product.rk_sku);
    const refreshedAt = new Date().toISOString();
    const updates = {
      ...(quantity !== null ? { stock: quantity, inStock: quantity >= 1 } : {}),
      ...(binLocation !== null ? { binLocation } : {}),
      inventoryRefreshedAt: refreshedAt,
    };

    await db.collection("products").updateOne(
      { _id: product._id },
      { $set: updates }
    );

    return NextResponse.json({
      product: {
        id: product.id || product._id?.toString(),
        quantity,
        binLocation,
        refreshedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching inventory stock:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch inventory stock" },
      { status: 500 }
    );
  }
}
