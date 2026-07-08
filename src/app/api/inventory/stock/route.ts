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

export async function GET() {
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
    
    // Fetch all products with rk_sku
    const products = await db.collection("products")
      .find({ rk_sku: { $exists: true, $ne: "" } })
      .project({ _id: 1, sku: 1, name: 1, rk_sku: 1, image: 1 })
      .toArray();

    if (products.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch stock for each product in parallel (limit to 20 concurrent to avoid rate limits)
    const stockData = await Promise.all(
      products.map(async (product: any) => {
        const { quantity, binLocation } = await fetchProductStock(apiId, apiKey, product.rk_sku);
        return {
          id: product._id?.toString() || product.id,
          sku: product.sku,
          name: product.name,
          rk_sku: product.rk_sku,
          image: product.image,
          quantity,
          binLocation,
        };
      })
    );

    return NextResponse.json({ products: stockData });
  } catch (error: any) {
    console.error("Error fetching inventory stock:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch inventory stock" },
      { status: 500 }
    );
  }
}
