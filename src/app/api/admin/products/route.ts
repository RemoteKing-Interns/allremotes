import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { getProductSkuForKey, normalizeSkuKey } from "@/lib/products-import";
import { writeProductsJson } from "@/lib/products-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function PUT(request: Request) {
  try {
    const list = await request.json().catch(() => null);
    if (!Array.isArray(list)) {
      return NextResponse.json(
        { error: "Body must be an array of products." },
        { status: 400 }
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
      return NextResponse.json({ ok: true, saved: ops.length });
    }

    await writeProductsJson(normalized);
    return NextResponse.json({ ok: true, saved: normalized.length, storage: "products.json" });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to save products",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
