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

    if (mongoEnabled()) {
      try {
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
            upserted: result?.upsertedCount || 0 
          });
        }
        return NextResponse.json({ ok: true, saved: ops.length }, {
          headers: CORS_HEADERS
        });
      } catch (mongoErr: any) {
        console.error("MongoDB save error:", mongoErr);
        // Fall back to JSON if MongoDB fails
        console.log("Falling back to JSON storage after MongoDB error");
        await writeProductsJson(normalized);
        return NextResponse.json({ 
          ok: true, 
          saved: normalized.length, 
          storage: "products.json (mongo fallback)",
          mongoError: mongoErr?.message 
        }, {
          headers: CORS_HEADERS
        });
      }
    }

    await writeProductsJson(normalized);
    return NextResponse.json({ ok: true, saved: normalized.length, storage: "products.json" }, {
      headers: CORS_HEADERS
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

    if (mongoEnabled()) {
      try {
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
            upserted: result?.upsertedCount || 0 
          });
        }
        return NextResponse.json({ ok: true, saved: ops.length }, {
          headers: CORS_HEADERS
        });
      } catch (mongoErr: any) {
        console.error("MongoDB save error:", mongoErr);
        await writeProductsJson(normalized);
        return NextResponse.json({ 
          ok: true, 
          saved: normalized.length, 
          storage: "products.json (mongo fallback)",
          mongoError: mongoErr?.message 
        }, {
          headers: CORS_HEADERS
        });
      }
    }

    await writeProductsJson(normalized);
    return NextResponse.json({ ok: true, saved: normalized.length, storage: "products.json" }, {
      headers: CORS_HEADERS
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
