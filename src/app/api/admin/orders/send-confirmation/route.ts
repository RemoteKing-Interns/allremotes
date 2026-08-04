import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { sendOrderConfirmationEmail, sendNewOrderNotification } from "@/lib/email";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDERS_JSON_PATH = path.resolve(process.cwd(), "orders.json");
const ADMIN_EMAIL = "shane@allremotes.com.au";

function adminAllowed() {
  if (process.env.ALLOW_ADMIN_ORDERS === "1") return true;
  return process.env.NODE_ENV !== "production";
}

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
  if (!adminAllowed()) {
    return NextResponse.json(
      { error: "Admin orders are disabled in production. Set ALLOW_ADMIN_ORDERS=1 to enable." },
      { status: 403 }
    );
  }

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
    const items = Array.isArray(order.items) ? order.items : [];
    const total = Number(order.pricing?.total ?? order.total ?? 0);

    if (!customerEmail) {
      return NextResponse.json({ error: "Order has no customer email" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Order has no items" }, { status: 400 });
    }

    const shippingAddress = [
      order.shipping?.address,
      [order.shipping?.city, order.shipping?.state, order.shipping?.zipCode]
        .filter(Boolean)
        .join(" "),
      order.shipping?.country,
    ]
      .filter(Boolean)
      .join("\n");

    const emailItems = items.map((item: any) => ({
      name: String(item.name),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price ?? item.unitPrice ?? 0),
    }));

    const adminItems = items.map((item: any) => `${item.name} x${item.quantity || 1}`);

    const [customerResult, adminResult] = await Promise.all([
      sendOrderConfirmationEmail({
        to: customerEmail,
        orderId: order.id,
        customerName,
        items: emailItems,
        total,
        shippingAddress,
      }),
      sendNewOrderNotification({
        to: ADMIN_EMAIL,
        orderId: order.id,
        customerName,
        customerEmail,
        total,
        items: adminItems,
      }),
    ]);

    return NextResponse.json({
      success: true,
      customerEmailSent: customerResult.success,
      adminEmailSent: adminResult.success,
      customerEmailError: customerResult.error,
      adminEmailError: adminResult.error,
    });
  } catch (error: any) {
    console.error("Send confirmation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send confirmation" },
      { status: 500 }
    );
  }
}
