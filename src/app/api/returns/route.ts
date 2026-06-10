import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETURNS_JSON_PATH = path.resolve(process.cwd(), "returns.json");

export type ReturnStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export type ReturnRequest = {
  id: string;
  orderId: string;
  orderDate: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  reason: "faulty" | "wrong_item" | "not_as_described" | "changed_mind" | "other";
  reasonDetails: string;
  condition: "unopened" | "opened_unused" | "used" | "damaged";
  photos?: string[];
  status: ReturnStatus;
  adminNotes?: string;
  resolution?: "refund" | "replacement" | "store_credit" | "rejected";
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  shippedDate?: string;
  deliveredDate?: string;
};

function makeReturnId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `RET-${stamp}-${rand}`;
}

function readReturnsFile(): ReturnRequest[] {
  try {
    const raw = fs.readFileSync(RETURNS_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ReturnRequest[]) : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

function writeReturnsFile(returns: ReturnRequest[]) {
  fs.writeFileSync(RETURNS_JSON_PATH, JSON.stringify(returns, null, 2) + "\n", "utf8");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");

    let returns: ReturnRequest[] = [];

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<ReturnRequest>("returns");
      const query: Record<string, any> = {};
      if (email) query.customerEmail = email;
      if (orderId) query.orderId = orderId;
      if (status) query.status = status;
      returns = await col.find(query).sort({ createdAt: -1 }).toArray() as ReturnRequest[];
    } else {
      returns = readReturnsFile();
      if (email) returns = returns.filter((r) => r.customerEmail === email);
      if (orderId) returns = returns.filter((r) => r.orderId === orderId);
      if (status) returns = returns.filter((r) => r.status === status);
      returns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json(returns, {
      headers: {
        "Cache-Control": "no-store",
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load returns", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: CORS_HEADERS });
    }

    const {
      orderId,
      orderDate,
      customerEmail,
      customerName,
      items,
      reason,
      reasonDetails,
      condition,
      photos,
      shippedDate,
      deliveredDate,
    } = body;

    if (!orderId || !customerEmail || !items || !reason || !condition) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, customerEmail, items, reason, condition" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const now = new Date().toISOString();
    const returnRequest: ReturnRequest = {
      id: makeReturnId(),
      orderId,
      orderDate: orderDate || now,
      customerEmail,
      customerName: customerName || "",
      items: Array.isArray(items) ? items : [],
      reason,
      reasonDetails: reasonDetails || "",
      condition,
      photos: Array.isArray(photos) ? photos : [],
      status: "pending",
      createdAt: now,
      updatedAt: now,
      shippedDate,
      deliveredDate,
    };

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("returns");
      await col.insertOne({ ...returnRequest });
    } else {
      const returns = readReturnsFile();
      returns.push(returnRequest);
      writeReturnsFile(returns);
    }

    return NextResponse.json(returnRequest, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create return request", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
