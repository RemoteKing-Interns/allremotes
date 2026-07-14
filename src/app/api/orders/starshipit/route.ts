import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { createStarshipitOrder } from "@/lib/starshipit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_ITEM_WEIGHT_KG = Number(process.env.STARSHIPIT_DEFAULT_ITEM_WEIGHT || 0.1);

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

    const customer = order.customer || {};
    const shipping = order.shipping || {};
    const items = Array.isArray(order.items) ? order.items : [];

    const totalWeight = items.reduce((sum: number, item: any) => {
      const weight = Number(item.weight || DEFAULT_ITEM_WEIGHT_KG);
      const qty = Number(item.quantity || 1);
      return sum + weight * qty;
    }, 0);

    const starshipitItems = items.map((item: any) => ({
      description: item.name || item.description,
      sku: item.sku || item.rk_sku || "",
      quantity: Number(item.quantity || 1),
      weight: Number(item.weight || DEFAULT_ITEM_WEIGHT_KG),
      value: Number(item.unitPrice || item.price || 0),
    }));

    const payload = {
      order_number: String(order.id),
      reference: String(order.id),
      shipping_method: shipping.method || "Standard",
      currency: "AUD",
      signature_required: false,
      destination: {
        name: customer.fullName || customer.name || "",
        phone: shipping.phone || customer.phone || "",
        street: shipping.address || "",
        suburb: shipping.city || "",
        city: shipping.city || "",
        state: shipping.state || "",
        post_code: shipping.zipCode || "",
        country: shipping.country || "Australia",
        delivery_instructions: shipping.deliveryInstructions || "",
      },
      items: starshipitItems,
      packages: [{ weight: Math.max(totalWeight, 0.01) }],
    };

    const result = await createStarshipitOrder(payload);
    const starshipitOrder = result?.order;

    await db.collection("orders").updateOne(
      { id: orderId },
      {
        $set: {
          starshipitOrderId: starshipitOrder?.order_id,
          starshipitOrderNumber: starshipitOrder?.order_number,
          starshipitPushedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Starshipit order creation error:", err?.message);
    return NextResponse.json(
      { error: "Failed to create Starshipit order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
