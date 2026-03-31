import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { readOrdersJson, writeOrdersJson, type OrderDoc } from "@/lib/orders-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function adminAllowed() {
  if (process.env.ALLOW_ADMIN_ORDERS === "1") return true;
  return process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!adminAllowed()) {
    return NextResponse.json(
      { error: "Admin orders are disabled in production. Set ALLOW_ADMIN_ORDERS=1 to enable." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") || 200)));

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      await col.createIndex({ id: 1 }, { unique: true });
      const orders = await col
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return NextResponse.json(orders, { headers: { "Cache-Control": "no-store" } });
    }

    const orders = await readOrdersJson();
    return NextResponse.json(orders.slice(0, limit), { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load orders", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!adminAllowed()) {
    return NextResponse.json(
      { error: "Admin orders are disabled in production. Set ALLOW_ADMIN_ORDERS=1 to enable." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const id = String(body?.id || "").trim();
    const status = String(body?.status || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (!["processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      const res = await col.updateOne({ id }, { $set: { status, updatedAt: now } });
      if (!res.matchedCount) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ ok: true, id, status, updatedAt: now });
    }

    const orders = await readOrdersJson();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const next: OrderDoc = { ...(orders[idx] as any), status, updatedAt: now };
    orders[idx] = next;
    await writeOrdersJson(orders);
    return NextResponse.json({ ok: true, id, status, updatedAt: now });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

