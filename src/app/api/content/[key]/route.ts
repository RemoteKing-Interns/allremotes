import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ALLOWED = new Set(["home", "navigation", "reviews", "promotions"]);

export async function GET(_: Request, context: { params: Promise<{ key: string }> }) {
  if (!mongoEnabled()) {
    return NextResponse.json(
      { error: "MongoDB is not configured. Set MONGODB_URI." },
      { status: 400 }
    );
  }

  try {
    const { key: rawKey } = await context.params;
    const key = String(rawKey || "").trim().toLowerCase();
    if (!ALLOWED.has(key)) return NextResponse.json({ error: "Unknown content key" }, { status: 404 });

    const db = await getDb();
    const col = db.collection<{ _id: string; data: any; updatedAt: string }>("content");

    const doc = await col.findOne({ _id: key });
    if (!doc) {
      const now = new Date().toISOString();
      await col.insertOne({ _id: key, data: null, updatedAt: now });
      return NextResponse.json({ key, data: null, updatedAt: now });
    }

    return NextResponse.json({
      key,
      data: (doc as any).data ?? null,
      updatedAt: (doc as any).updatedAt ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load content", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ key: string }> }) {
  if (!mongoEnabled()) {
    return NextResponse.json(
      { error: "MongoDB is not configured. Set MONGODB_URI." },
      { status: 400 }
    );
  }

  try {
    const { key: rawKey } = await context.params;
    const key = String(rawKey || "").trim().toLowerCase();
    if (!ALLOWED.has(key)) return NextResponse.json({ error: "Unknown content key" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const db = await getDb();
    const col = db.collection<{ _id: string; data: any; updatedAt: string }>("content");
    const now = new Date().toISOString();

    await col.updateOne(
      { _id: key },
      { $set: { data: body ?? null, updatedAt: now } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, key, updatedAt: now });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save content", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
