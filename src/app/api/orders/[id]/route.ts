import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORDERS_JSON_PATH = path.resolve(process.cwd(), "orders.json");

type OrderDoc = Record<string, any> & { id: string; updatedAt?: string };

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

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      const order = await col.findOne({ id });
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(order);
    }

    const orders = readOrdersFile();
    const order = orders.find((o) => o.id === id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    const status = String(body?.status || "").trim();
    if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

    const updatedAt = new Date().toISOString();

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      const res = await col.findOneAndUpdate(
        { id },
        { $set: { status, updatedAt } }
      );
      if (!res.value) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(res.value);
    }

    const orders = readOrdersFile();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const updated = { ...orders[idx], status, updatedAt };
    orders[idx] = updated;
    writeOrdersFile(orders);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
