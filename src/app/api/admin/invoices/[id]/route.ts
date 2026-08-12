import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!mongoEnabled()) {
    return NextResponse.json(
      { error: "MongoDB is not configured." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const { id } = await params;
    const db = await getDb();
    const order = await db.collection("orders").findOne({ id, type: "invoice" });
    if (!order) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json({ ok: true, order }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch invoice", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!mongoEnabled()) {
    return NextResponse.json(
      { error: "MongoDB is not configured." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const action = String(body?.action || "").toLowerCase();
    if (!action) {
      return NextResponse.json(
        { error: "Missing action" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const now = new Date().toISOString();
    const update: any = { $set: { updatedAt: now } };

    if (action === "paid") {
      update.$set.status = "paid";
      update.$set["payment.status"] = "succeeded";
      update.$set["payment.method"] = "bank transfer";
      update.$set.paidAt = now;
      const base = id.replace(/_unpaid_invoice$/, "").replace(/_invoice$/, "");
      update.$set.id = `${base}_invoice`;
    } else if (action === "shipped") {
      update.$set.status = "shipped";
      update.$set.shippedAt = now;
    } else if (action === "reopen") {
      update.$set.status = "unpaid";
      update.$set["payment.status"] = "unpaid";
      update.$set["payment.method"] = "invoice";
      const base = id.replace(/_unpaid_invoice$/, "").replace(/_invoice$/, "");
      update.$set.id = `${base}_unpaid_invoice`;
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const db = await getDb();
    const result = await db
      .collection("orders")
      .findOneAndUpdate({ id, type: "invoice" }, update, {
        returnDocument: "after",
      });

    if (!result) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { ok: true, order: result },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update invoice", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!mongoEnabled()) {
    return NextResponse.json(
      { error: "MongoDB is not configured." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const { id } = await params;
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

    const now = new Date().toISOString();
    const update = {
      customer: body.customer,
      shipping: body.shipping,
      items,
      pricing: body.pricing,
      updatedAt: now,
    };

    const db = await getDb();
    const result = await db
      .collection("orders")
      .findOneAndUpdate(
        { id, type: "invoice" },
        { $set: update },
        { returnDocument: "after" }
      );

    if (!result) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { ok: true, order: result },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update invoice", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!mongoEnabled()) {
    return NextResponse.json(
      { error: "MongoDB is not configured." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection("orders").deleteOne({ id, type: "invoice" });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete invoice", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
