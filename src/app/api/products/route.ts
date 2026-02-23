import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { readProductsJson } from "@/lib/products-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let products: any[];
    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("products");
      await col.createIndex({ id: 1 }, { unique: true });
      await col.createIndex({ skuKey: 1 }, { unique: true, sparse: true });
      products = await col.find({}).project({ _id: 0 }).toArray();
    } else {
      products = await readProductsJson();
    }

    return NextResponse.json(products, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load products",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

