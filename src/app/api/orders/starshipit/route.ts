import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { pushOrderToStarshipit } from "@/lib/starshipit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { orderId } = body || {};

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    }

    const db = await getDb();
    const order = await db.collection("orders").findOne({ id: orderId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { order: starshipitOrder, created, alreadyExists } = await pushOrderToStarshipit(order);

    if (!starshipitOrder?.order_id) {
      return NextResponse.json(
        { error: "Starshipit did not return an order_id" },
        { status: 500 }
      );
    }

    await db.collection("orders").updateOne(
      { id: orderId },
      {
        $set: {
          starshipitOrderId: starshipitOrder.order_id,
          starshipitOrderNumber: starshipitOrder.order_number,
          starshipitPushedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({ success: true, created, alreadyExists, order: starshipitOrder });
  } catch (err: any) {
    console.error("Starshipit order creation error:", err?.message);
    return NextResponse.json(
      { error: "Failed to create Starshipit order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
