import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { pickopsMongoEnabled, getPickopsDb } from "@/lib/pickops-mongo";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, { ok: boolean; detail: string }> = {};

  // Test allremotes MongoDB
  if (mongoEnabled()) {
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      const collections = await db.listCollections().toArray();
      results.allremotes_mongo = { ok: true, detail: `Connected — ${collections.length} collections` };
    } catch (err: any) {
      results.allremotes_mongo = { ok: false, detail: err?.message };
    }
  } else {
    results.allremotes_mongo = { ok: false, detail: "MONGODB_URI not set" };
  }

  // Test PickOps MongoDB
  if (pickopsMongoEnabled()) {
    try {
      const db = await getPickopsDb();
      await db.command({ ping: 1 });
      const count = await db.collection("warehouseOrders").countDocuments();
      results.pickops_mongo = { ok: true, detail: `Connected — ${count} warehouseOrders` };
    } catch (err: any) {
      results.pickops_mongo = { ok: false, detail: err?.message };
    }
  } else {
    results.pickops_mongo = { ok: false, detail: "PICKOPS_MONGODB_URI not set" };
  }

  const allOk = Object.values(results).every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 500 });
}
