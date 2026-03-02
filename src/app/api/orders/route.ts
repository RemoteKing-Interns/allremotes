import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { appendOrderJson, readOrdersJson, type OrderDoc } from "@/lib/orders-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function makeOrderId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

function safeEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  return email.includes("@") ? email : "";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = safeEmail(searchParams.get("email"));
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      await col.createIndex({ id: 1 }, { unique: true });
      await col.createIndex({ "customer.email": 1 });
      const orders = await col
        .find({ "customer.email": email })
        .project({ _id: 0 })
        .sort({ createdAt: -1 })
        .toArray();
      return NextResponse.json(orders, { headers: { "Cache-Control": "no-store" } });
    }

    const all = await readOrdersJson();
    const orders = all.filter((o) => String(o?.customer?.email || "").toLowerCase() === email);
    return NextResponse.json(orders, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load orders", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const email = safeEmail((body as any)?.customer?.email);
    const fullName = String((body as any)?.customer?.fullName || "").trim();
    if (!email || !fullName) {
      return NextResponse.json({ error: "Missing customer name/email" }, { status: 400 });
    }

    const items = Array.isArray((body as any).items) ? (body as any).items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "Order must include items" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const order: OrderDoc = {
      id: makeOrderId(),
      status: "processing",
      createdAt: now,
      updatedAt: now,
      customer: { fullName, email },
      shipping: {
        address: String((body as any)?.shipping?.address || ""),
        city: String((body as any)?.shipping?.city || ""),
        state: String((body as any)?.shipping?.state || ""),
        zipCode: String((body as any)?.shipping?.zipCode || ""),
        country: String((body as any)?.shipping?.country || "") || undefined,
      },
      pricing: {
        currency: String((body as any)?.pricing?.currency || "AUD"),
        subtotal: Number((body as any)?.pricing?.subtotal || 0),
        discountTotal: Number((body as any)?.pricing?.discountTotal || 0),
        total: Number((body as any)?.pricing?.total || 0),
        hasMemberDiscount: Boolean((body as any)?.pricing?.hasMemberDiscount),
        memberDiscountRate: Number((body as any)?.pricing?.memberDiscountRate || 0),
      },
      items: items.map((it: any) => ({
        id: String(it?.id || ""),
        name: String(it?.name || ""),
        category: String(it?.category || ""),
        quantity: Math.max(1, Number(it?.quantity || 1)),
        unitPrice: Number(it?.unitPrice || 0),
        lineTotal: Number(it?.lineTotal || 0),
      })),
    };

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      await col.createIndex({ id: 1 }, { unique: true });
      await col.createIndex({ "customer.email": 1 });
      await col.insertOne({ ...(order as any) });
    } else {
      await appendOrderJson(order);
    }

    return NextResponse.json({ ok: true, id: order.id, createdAt: order.createdAt });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to place order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

