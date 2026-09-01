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

    // Deduplicate by skuKey, then id
    const seen = new Map<string, any>();
    const unique: any[] = [];
    for (const doc of normalized) {
      const key = doc.skuKey ? String(doc.skuKey) : String(doc.id);
      if (!seen.has(key)) {
        unique.push(doc);
      } else {
        const idx = unique.findIndex((d) => (d.skuKey ? String(d.skuKey) : String(d.id)) === key);
        if (idx !== -1) unique[idx] = doc;
      }
      seen.set(key, doc);
    }

    // Reconcile saved ids so updates target the correct SKU
    const skuKeys = unique.map((d) => d.skuKey).filter(Boolean);
    const existingBySku = new Map<string, any>();
    if (skuKeys.length > 0) {
      const existing = await col
        .find({ skuKey: { $in: skuKeys } })
        .project({ _id: 1, id: 1, skuKey: 1 })
        .toArray();
      for (const e of existing) {
        if (e.skuKey) existingBySku.set(String(e.skuKey), e);
      }
    }

    for (const doc of unique) {
      const existing = doc.skuKey ? existingBySku.get(String(doc.skuKey)) : null;
      if (existing && existing.id) {
        doc.id = existing.id;
      }
    }

    const ops: any[] = unique.map((doc) => ({
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: CORS_HEADERS });
    }

    const status = String(body.status || "").trim();
    if (!["active", "draft", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be active, draft, or archived." }, { status: 400, headers: CORS_HEADERS });
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503, headers: CORS_HEADERS });
    }

    const db = await getDb();
    const col = db.collection("products");
    const now = new Date().toISOString();

    // Single product update
    if (body.id) {
      const result = await col.updateOne(
        { id: String(body.id) },
        { $set: { status, updatedAt: now } }
      );
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404, headers: CORS_HEADERS });
      }
      return NextResponse.json({ ok: true, id: body.id, status, modified: result.modifiedCount }, { headers: CORS_HEADERS });
    }

    // Bulk update
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const ids = body.ids.map(String);
      const result = await col.updateMany(
        { id: { $in: ids } },
        { $set: { status, updatedAt: now } }
      );
      return NextResponse.json({ ok: true, status, matched: result.matchedCount, modified: result.modifiedCount }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ error: "Either id or ids[] is required" }, { status: 400, headers: CORS_HEADERS });
  } catch (err: any) {
    console.error("API /admin/products PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update product status", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
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
