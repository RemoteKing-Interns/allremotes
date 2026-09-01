import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { sendReviewRequestEmail } from "@/lib/email";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDERS_JSON_PATH = path.resolve(process.cwd(), "orders.json");

function readOrdersFile(): any[] {
  try {
    const raw = fs.readFileSync(ORDERS_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

async function getOrderById(id: string) {
  if (mongoEnabled()) {
    const db = await getDb();
    return await db.collection("orders").findOne({ id });
  }
  return readOrdersFile().find((o: any) => o.id === id) || null;
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const customerEmail = order.customer?.email;
    const customerName = order.customer?.fullName || order.customer?.name || "Customer";

    if (!customerEmail) {
      return NextResponse.json({ error: "Order has no customer email" }, { status: 400 });
    }

    const result = await sendReviewRequestEmail({
      to: customerEmail,
      orderId: order.id,
      customerName,
    });

    // Mark order as review requested
    const now = new Date().toISOString();
    if (mongoEnabled()) {
      const db = await getDb();
      await db.collection("orders").updateOne(
        { id: orderId },
        { $set: { reviewRequestedAt: now } }
      );
    }

    return NextResponse.json({
      success: result.success,
      error: result.error,
      reviewRequestedAt: now,
    });
  } catch (error: any) {
    console.error("Send review request error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send review request" },
      { status: 500 }
    );
  }
}
