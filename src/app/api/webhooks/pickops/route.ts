import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { pushOrderToStarshipit } from "@/lib/starshipit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPickedStatus(status?: string): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes("picked") || s.includes("packed");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) || {};
    const orderNumber =
      body.orderNumber || body.orderId || body.order_number || body.order_id;
    const status =
      body.status || body.currentCustomStatus || body.event || "";

    if (!orderNumber) {
      return NextResponse.json(
        { error: "orderNumber is required" },
        { status: 400 }
      );
    }

    if (!isPickedStatus(status)) {
      return NextResponse.json(
        { success: true, skipped: true, reason: "Status not picked", status },
        { status: 200 }
      );
    }

    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured" },
        { status: 503 }
      );
    }

    const db = await getDb();
    const order = await db.collection("orders").findOne({ id: orderNumber });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { order: starshipitOrder, created, alreadyExists } =
      await pushOrderToStarshipit(order);

    if (!starshipitOrder?.order_id) {
      return NextResponse.json(
        { error: "Starshipit did not return an order_id" },
        { status: 500 }
      );
    }

    await db.collection("orders").updateOne(
      { id: orderNumber },
      {
        $set: {
          starshipitOrderId: starshipitOrder.order_id,
          starshipitOrderNumber: starshipitOrder.order_number,
          starshipitPushedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json(
      { success: true, created, alreadyExists, order: starshipitOrder },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PickOps webhook error:", err?.message);
    return NextResponse.json(
      { error: "Failed to process PickOps webhook", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
