import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { getProductSkuForKey, normalizeSkuKey } from "@/lib/products-import";

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
      // Strip _id to avoid MongoDB immutable field error on update
      // Strip cat3 as it's been deprecated in favor of 2-tier category system
      const { _id, cat3, ...rest } = raw as any;
      const doc = {
        ...rest,
        id,
        sku: sku || "",
        skuKey: skuKey || undefined,
        updatedAt: nowIso,
        createdAt: (raw as any).createdAt || nowIso,
      };
      normalized.push(doc);
    }

    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured. Product changes require MongoDB." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const db = await getDb();
    const col = db.collection("products");

    // Create indexes with error handling
    try {
      await col.createIndex({ id: 1 }, { unique: true });
    } catch (indexErr) {
      console.warn("Failed to create id index (may already exist):", indexErr);
    }

    try {
      await col.createIndex({ skuKey: 1 }, { unique: true, sparse: true });
    } catch (indexErr) {
      console.warn("Failed to create skuKey index (may already exist):", indexErr);
    }

    const ops: any[] = normalized.map((doc) => ({
      updateOne: {
        filter: { id: doc.id },
        update: { $set: doc },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      const result = await col.bulkWrite(ops, { ordered: false });
      console.log("MongoDB bulkWrite result:", {
        inserted: result?.insertedCount || 0,
        modified: result?.modifiedCount || 0,
        upserted: result?.upsertedCount || 0,
      });
    }
    return NextResponse.json({ ok: true, saved: ops.length, storage: "mongodb" }, {
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    console.error("API /admin/products PUT error:", err);
    return NextResponse.json(
      {
        error: "Failed to save products",
        details: err?.message || String(err),
        stack: err?.stack || null,
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get("limit") || 200)));
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const search = String(searchParams.get("search") || "").trim().toLowerCase();

    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const db = await getDb();
    const col = db.collection("products");
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
      ];
    }
    const total = await col.countDocuments(filter);
    const products = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    return NextResponse.json({ products, total, page, limit, source: "mongodb" }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load products", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// POST handler - same as PUT but accepts { products: [...] } format
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const list = body?.products || body;
    
    if (!Array.isArray(list)) {
      return NextResponse.json(
        { error: "Body must be an array of products or { products: [...] }." },
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
      const { _id, cat3, ...rest } = raw as any;
      const doc = {
        ...rest,
        id,
        sku: sku || "",
        skuKey: skuKey || undefined,
        updatedAt: nowIso,
        createdAt: (raw as any).createdAt || nowIso,
      };
      normalized.push(doc);
    }

    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured. Product changes require MongoDB." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const db = await getDb();
    const col = db.collection("products");

    try {
      await col.createIndex({ id: 1 }, { unique: true });
    } catch (indexErr) {
      console.warn("Failed to create id index (may already exist):", indexErr);
    }

    try {
      await col.createIndex({ skuKey: 1 }, { unique: true, sparse: true });
    } catch (indexErr) {
      console.warn("Failed to create skuKey index (may already exist):", indexErr);
    }

    const ops: any[] = normalized.map((doc) => ({
      updateOne: {
        filter: { id: doc.id },
        update: { $set: doc },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      const result = await col.bulkWrite(ops, { ordered: false });
      console.log("MongoDB bulkWrite result:", {
        inserted: result?.insertedCount || 0,
        modified: result?.modifiedCount || 0,
        upserted: result?.upsertedCount || 0,
      });
    }
    return NextResponse.json({ ok: true, saved: ops.length, storage: "mongodb" }, {
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    console.error("API /admin/products POST error:", err);
    return NextResponse.json(
      {
        error: "Failed to save products",
        details: err?.message || String(err),
        stack: err?.stack || null,
      },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}
