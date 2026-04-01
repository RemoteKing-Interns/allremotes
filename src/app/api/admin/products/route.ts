import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { getProductSkuForKey, normalizeSkuKey } from "@/lib/products-import";
import { writeProductsJson } from "@/lib/products-json";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function PUT(request: Request) {
  try {
    const list = await request.json().catch(() => null);
    if (!Array.isArray(list)) {
      return NextResponse.json(
        { error: "Body must be an array of products." },
        { 
          status: 400,
          headers: CORS_HEADERS 
        }
      );
    }

    const nowIso = new Date().toISOString();
    const normalized: any[] = [];

    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      const id = String((raw as any).id || "").trim() || crypto.randomUUID();
      const sku = String((raw as any).sku || getProductSkuForKey(raw) || "").trim();
      const skuKey = sku ? normalizeSkuKey(sku) : null;
      const doc = {
        ...(raw as any),
        id,
        sku: sku || "",
        skuKey: skuKey || undefined,
        updatedAt: nowIso,
        createdAt: (raw as any).createdAt || nowIso,
      };
      normalized.push(doc);
    }

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("products");
      await col.createIndex({ id: 1 }, { unique: true });
      await col.createIndex({ skuKey: 1 }, { unique: true, sparse: true });

      const ops: any[] = normalized.map((doc) => ({
        updateOne: {
          filter: { id: doc.id },
          update: { $set: doc },
          upsert: true,
        },
      }));

      if (ops.length > 0) {
        await col.bulkWrite(ops, { ordered: false });
      }
      return NextResponse.json({ ok: true, saved: ops.length }, {
        headers: CORS_HEADERS
      });
    }

    await writeProductsJson(normalized);
    return NextResponse.json({ ok: true, saved: normalized.length, storage: "products.json" }, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to save products",
        details: err?.message || String(err),
      },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
