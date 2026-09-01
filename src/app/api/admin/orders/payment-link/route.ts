import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { getPaymentRequestEmailHtml, sendPaymentRequestEmail } from "@/lib/email";
import { decryptPii, PII_FIELDS } from "@/lib/pii-crypto";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDERS_JSON_PATH = path.resolve(process.cwd(), "orders.json");

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe is not configured");
  }
  return new Stripe(key);
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

async function updateOrder(id: string, updates: any) {
  const now = new Date().toISOString();
  if (mongoEnabled()) {
    const db = await getDb();
    await db
      .collection("orders")
      .updateOne({ id }, { $set: { ...updates, updatedAt: now } });
    return;
  }
  const orders = readOrdersFile();
  const idx = orders.findIndex((o: any) => o.id === id);
  if (idx === -1) throw new Error("Order not found");
  orders[idx] = { ...orders[idx], ...updates, updatedAt: now };
  fs.writeFileSync(ORDERS_JSON_PATH, JSON.stringify(orders, null, 2), "utf8");
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, message, preview } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    decryptPii(order, PII_FIELDS.order);

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const customerName =
      order.customer?.fullName || order.customer?.email || "Customer";
    const totalAmount = order.pricing?.total ?? 0;
    const isHighValueOrder = totalAmount > 500;

    if (preview) {
      const html = getPaymentRequestEmailHtml({
        orderId: order.id,
        customerName,
        total: totalAmount,
        paymentUrl: `${origin}/order-success?session_id=PENDING`,
        message,
      });
      return NextResponse.json({ html });
    }

    const stripe = getStripeClient();

    // If a payment link was already sent, check whether the customer has paid
    if (order.paymentLink?.sessionId) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(order.paymentLink.sessionId);
        if (existingSession.payment_status === "paid") {
          const now = new Date().toISOString();
          await updateOrder(orderId, {
            status: "processing",
            payment: {
              ...(order.payment || {}),
              method: "stripe",
              status: "succeeded",
              sessionId: order.paymentLink.sessionId,
            },
            paymentLink: { ...(order.paymentLink || {}), paidAt: now },
          });
          return NextResponse.json({ alreadyPaid: true });
        }
      } catch (err: any) {
        console.error("Failed to retrieve existing payment session:", err.message);
      }
    }

    // Do not resend a payment link for the same order
    if (order.paymentLink?.sentAt) {
      return NextResponse.json({
        alreadySent: true,
        sentAt: order.paymentLink.sentAt,
        url: order.paymentLink.url,
        sessionId: order.paymentLink.sessionId,
      });
    }

    if (
      order.payment?.status === "succeeded" ||
      order.status === "paid" ||
      order.status === "processing"
    ) {
      return NextResponse.json(
        { error: "Order is already paid or processing" },
        { status: 400 }
      );
    }

    const line_items = (order.items || []).map((item: any) => ({
      price_data: {
        currency: "aud",
        product_data: {
          name: item.name,
          description: `Category: ${item.category || "Remote Control"}`,
        },
        unit_amount: Math.round((item.unitPrice || item.price || 0) * 100),
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      payment_method_options: {
        card: {
          request_three_d_secure: (isHighValueOrder ? "any" : "automatic") as any,
        },
      } as any,
      line_items,
      mode: "payment",
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${encodeURIComponent(orderId)}`,
      cancel_url: `${origin}/account/orders`,
      customer_email: order.customer?.email,
      metadata: {
        order_id: orderId,
        order_value: totalAmount.toString(),
      },
    });

    const paymentUrl = session.url;
    if (!paymentUrl) {
      throw new Error("Stripe did not return a payment URL");
    }

    const emailResult = await sendPaymentRequestEmail({
      to: order.customer?.email,
      orderId: order.id,
      customerName,
      total: totalAmount,
      paymentUrl,
      message,
    });

    const now = new Date().toISOString();
    await updateOrder(orderId, {
      payment: {
        ...(order.payment || {}),
        method: "stripe",
        status: "pending",
        sessionId: session.id,
      },
      paymentLink: {
        sentAt: now,
        sessionId: session.id,
        url: paymentUrl,
        message: message?.trim() || "",
      },
    });

    return NextResponse.json({
      url: paymentUrl,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    });
  } catch (error: any) {
    console.error("Payment link error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment link" },
      { status: 500 }
    );
  }
}
