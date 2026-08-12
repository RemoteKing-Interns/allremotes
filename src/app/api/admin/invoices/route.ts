import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function makeInvoiceId(): Promise<string> {
  const db = await getDb();
  const result = await db.collection("counters").findOneAndUpdate(
    { _id: "orders" as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const seq: number = (result as any)?.seq ?? (result as any)?.value?.seq ?? 1;
  return `ARSO-${String(seq).padStart(6, "0")}`;
}

function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  if (!mongoEnabled()) {
    return NextResponse.json(
      { error: "MongoDB is not configured. Invoices require MongoDB." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid body" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const normalizedItems = items.map((item: any) => {
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const price = roundMoney(item.unitPrice);
      return {
        id: String(item.id || ""),
        name: String(item.name || ""),
        sku: String(item.sku || ""),
        rk_sku: String(item.rk_sku || ""),
        category: String(item.category || ""),
        quantity: qty,
        unitPrice: price,
        lineTotal: roundMoney(qty * price),
      };
    });

    const subtotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const discountTotal = roundMoney(Number(body.pricing?.discountTotal) || 0);
    const total = roundMoney(subtotal - discountTotal);

    const now = new Date().toISOString();
    const doc: Record<string, any> = {
      id: await makeInvoiceId(),
      type: "invoice",
      status: "unpaid",
      payment: {
        method: "invoice",
        status: "unpaid",
      },
      customer: {
        fullName: String(body.customer?.fullName || "").trim(),
        email: String(body.customer?.email || "").trim(),
        phone: String(body.customer?.phone || "").trim(),
      },
      shipping: {
        address: String(body.shipping?.address || "").trim(),
        city: String(body.shipping?.city || "").trim(),
        state: String(body.shipping?.state || "").trim(),
        zipCode: String(body.shipping?.zipCode || "").trim(),
        country: String(body.shipping?.country || "AU").trim(),
        phone: String(body.shipping?.phone || "").trim(),
      },
      items: normalizedItems,
      pricing: {
        currency: "AUD",
        subtotal,
        discountTotal,
        total,
      },
      notes: String(body.notes || "").trim(),
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    await db.collection("orders").insertOne(doc);

    return NextResponse.json({ ok: true, order: doc }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create invoice", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET(request: Request) {
  if (!mongoEnabled()) {
    return NextResponse.json(
      { error: "MongoDB is not configured. Invoices require MongoDB." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query: any = { type: "invoice" };
    if (status) query.status = status;

    const db = await getDb();
    const orders = await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ ok: true, orders }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to list invoices", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
