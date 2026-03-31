import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORDERS_JSON_PATH = path.resolve(process.cwd(), "orders.json");

type OrderDoc = Record<string, any> & {
  id: string;
  createdAt: string;
  updatedAt?: string;
};

function makeOrderId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

function readOrdersFile(): OrderDoc[] {
  try {
    const raw = fs.readFileSync(ORDERS_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrderDoc[]) : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

function writeOrdersFile(orders: OrderDoc[]) {
  fs.writeFileSync(ORDERS_JSON_PATH, JSON.stringify(orders, null, 2) + "\n", "utf8");
}

export async function GET() {
  try {
    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      const orders = await col.find({}).toArray();
      return NextResponse.json(orders, { 
        headers: { 
          "Cache-Control": "no-store",
          ...CORS_HEADERS 
        } 
      });
    }

    const orders = readOrdersFile();
    return NextResponse.json(orders, { 
      headers: { 
        "Cache-Control": "no-store",
        ...CORS_HEADERS 
      } 
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load orders", details: err?.message || String(err) },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { 
        status: 400,
        headers: CORS_HEADERS 
      });
    }

    const now = new Date().toISOString();
    const order: OrderDoc = {
      ...(body as Record<string, any>),
      id: makeOrderId(),
      createdAt: now,
      updatedAt: now,
    };

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      await col.insertOne({ ...(order as any) });
      return NextResponse.json(order, {
        headers: CORS_HEADERS
      });
    }

    const orders = readOrdersFile();
    orders.push(order);
    writeOrdersFile(orders);
    return NextResponse.json(order, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create order", details: err?.message || String(err) },
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
