import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { decryptPii, PII_FIELDS } from "@/lib/pii-crypto";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL || "*",
  "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
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
    const order = await db.collection("orders").findOne({ id });
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    decryptPii(order, PII_FIELDS.order);
    return NextResponse.json({ ok: true, order }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch order", details: err?.message || String(err) },
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
    const result = await db.collection("orders").deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete order", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
