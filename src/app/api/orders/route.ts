import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "../../../lib/mongo";
import { sendOrderShippedSms, sendOrderDeliveredSms, isSmsConfigured } from "../../../lib/sms";
import { sendShippingUpdateEmail, sendOrderDeliveredEmail } from "../../../lib/email";
import { decryptPii, decryptPiiArray, emailHash, PII_FIELDS } from "../../../lib/pii-crypto";
import { getStarshipitTracking, starshipitConfigured } from "../../../lib/starshipit";
import { buildTrackingLink } from "../../../lib/tracking";
import {
  createOrderRecord,
  findOrderBySessionId,
  readOrdersFile,
  writeOrdersFile,
  OrderDoc,
} from "../../../lib/order-create";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // Get email filter from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const orderId = searchParams.get("orderId");
    
    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      
      // Build query - filter by email and/or orderId if provided
      const query: Record<string, any> = {};
      if (email) query["customer.emailHash"] = emailHash(email);
      if (orderId) query["id"] = { $regex: new RegExp(orderId.replace(/[#]/g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") };
      const orders = await col.find(query).sort({ createdAt: -1 }).toArray();
      
      // Decrypt PII for response
      const decryptedOrders = decryptPiiArray(orders, PII_FIELDS.order);

      // Admin refresh (unfiltered list): poll Starshipit for tracking on pushed-but-untracked
      // orders; backfill tracking + mark shipped, email customer once per order.
      if (!email && !orderId && starshipitConfigured()) {
        const POST_SHIP = new Set(["shipped", "delivered", "customer_received"]);
        const pending = decryptedOrders.filter((o: any) =>
          o.starshipitOrderNumber &&
          !o.trackingNumber &&
          String(o.status || "").toLowerCase() !== "cancelled"
        );
        const results = await Promise.allSettled(pending.map(async (o: any) => {
          const t = await getStarshipitTracking(o.starshipitOrderNumber);
          if (!t?.tracking_number) return;
          const now = new Date().toISOString();
          const carrier = t.carrier_name || "";
          const wasPostShip = POST_SHIP.has(String(o.status || "").toLowerCase());
          const shipped: Record<string, any> = {
            shippedAt: t.shipment_date || now,
            carrier,
            trackingNumber: t.tracking_number,
            trackingLink: t.tracking_url || buildTrackingLink(carrier, t.tracking_number),
            updatedAt: now,
          };
          if (!wasPostShip) shipped.status = "shipped";
          // Guard so concurrent refreshes can't claim + email the same order twice
          const res = await col.updateOne(
            { id: o.id, $or: [{ trackingNumber: { $exists: false } }, { trackingNumber: null }, { trackingNumber: "" }] },
            { $set: shipped }
          );
          if (!res.matchedCount) return;
          Object.assign(o, shipped);
          // Only email on a real processing->shipped transition; backfills on already-shipped
          // orders stay silent, and the flag prevents any resend.
          if (!wasPostShip && !o.trackingEmailSentAt && o.channel !== "ebay" && o.customer?.email) {
            const emailRes = await sendShippingUpdateEmail({
              to: o.customer.email,
              orderId: o.id,
              customerName: o.customer?.fullName || o.customer?.name || "Customer",
              trackingNumber: shipped.trackingNumber,
              carrier,
              status: "Shipped",
              trackingLink: shipped.trackingLink,
            }).catch((e: any) => ({ success: false, error: e?.message }));
            if (emailRes?.success) {
              await col.updateOne({ id: o.id }, { $set: { trackingEmailSentAt: now } });
              o.trackingEmailSentAt = now;
            } else {
              console.error(`Starshipit shipped email failed for ${o.id}:`, emailRes?.error);
            }
          }
        }));
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            console.error(`Starshipit tracking poll failed for ${pending[i]?.id}:`, (r.reason as any)?.message || r.reason);
          }
        });

        // Shipped orders with tracking: flip to delivered once Starshipit says so,
        // email the customer once per order (silent for eBay).
        const shippedOrders = decryptedOrders.filter((o: any) =>
          o.starshipitOrderNumber &&
          o.trackingNumber &&
          String(o.status || "").toLowerCase() === "shipped"
        );
        const deliveredResults = await Promise.allSettled(shippedOrders.map(async (o: any) => {
          const t = await getStarshipitTracking(o.starshipitOrderNumber);
          if (String(t?.tracking_status || t?.order_status || "").toLowerCase() !== "delivered") return;
          const now = new Date().toISOString();
          // Same-status guard so concurrent refreshes can't double-deliver/email
          const res = await col.updateOne(
            { id: o.id, status: "shipped" },
            { $set: { status: "delivered", deliveredAt: t.last_updated_date || now, updatedAt: now } }
          );
          if (!res.matchedCount) return;
          o.status = "delivered";
          o.deliveredAt = t.last_updated_date || now;
          if (!o.deliveredEmailSentAt && o.channel !== "ebay" && o.customer?.email) {
            const emailRes = await sendOrderDeliveredEmail({
              to: o.customer.email,
              orderId: o.id,
              customerName: o.customer?.fullName || o.customer?.name || "Customer",
              deliveredDate: new Date(o.deliveredAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }),
            }).catch((e: any) => ({ success: false, error: e?.message }));
            if (emailRes?.success) {
              await col.updateOne({ id: o.id }, { $set: { deliveredEmailSentAt: now } });
              o.deliveredEmailSentAt = now;
            } else {
              console.error(`Starshipit delivered email failed for ${o.id}:`, emailRes?.error);
            }
          }
        }));
        deliveredResults.forEach((r, i) => {
          if (r.status === "rejected") {
            console.error(`Starshipit delivered poll failed for ${shippedOrders[i]?.id}:`, (r.reason as any)?.message || r.reason);
          }
        });
      }

      return NextResponse.json(decryptedOrders, {
        headers: { 
          "Cache-Control": "no-store",
          ...CORS_HEADERS 
        } 
      });
    }

    // File-based fallback
    let orders = readOrdersFile();
    if (email) {
      orders = orders.filter(o => 
        o.customer?.email?.toLowerCase() === email.toLowerCase()
      );
    }
    if (orderId) {
      const cleanId = orderId.replace(/^#/, "").toLowerCase();
      orders = orders.filter(o => String(o.id || "").toLowerCase().includes(cleanId));
    }
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
    if (!Array.isArray((body as any).items) || (body as any).items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    // Idempotency: the Stripe webhook safety net may already have created this
    // order for the same checkout session. Return the existing order instead
    // of creating a duplicate.
    const sessionId = (body as any).payment?.sessionId;
    const existing = await findOrderBySessionId(sessionId);
    if (existing) {
      return NextResponse.json(existing, { headers: CORS_HEADERS });
    }

    const order = await createOrderRecord(body as Record<string, any>, {
      notify: (body as any).sendNotifications !== false,
    });

    // Decrypt a copy for the response
    const orderResponse = { ...order };
    decryptPii(orderResponse, PII_FIELDS.order);
    return NextResponse.json(orderResponse, {
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

export async function PUT(request: Request) {
  try {
    const { orderId, status, trackingNumber, customerEmail, payment } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const now = new Date().toISOString();
    let updatedOrder: OrderDoc | null = null;

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");

      const updateData: any = {
        status,
        updatedAt: now
      };

      if (payment) {
        updateData.payment = payment;
      }

      if (status === 'shipped') {
        updateData.shippedAt = now;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
      } else if (status === 'delivered') {
        updateData.deliveredAt = now;
      } else if (status === 'customer_received') {
        updateData.customerReceivedAt = now;
      }

      // MongoDB driver v4: returns { value: doc }, driver v5: returns doc directly
      const rawResult = await col.findOneAndUpdate(
        { id: orderId },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      const resultDoc = (rawResult as any)?.value !== undefined
        ? (rawResult as any).value
        : rawResult;

      if (resultDoc && typeof resultDoc === 'object' && !Array.isArray(resultDoc)) {
        updatedOrder = resultDoc as OrderDoc;
        if (!updatedOrder.id) updatedOrder.id = orderId;
      } else {
        // Fallback: re-query the doc to confirm it exists
        updatedOrder = (await col.findOne({ id: orderId })) as unknown as OrderDoc | null;
      }
      // Decrypt PII for response/SMS
      if (updatedOrder) decryptPii(updatedOrder, PII_FIELDS.order);
    } else {
      // File-based fallback
      const orders = readOrdersFile();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        orders[idx].status = status;
        orders[idx].updatedAt = now;
        if (status === 'shipped') {
          orders[idx].shippedAt = now;
          if (trackingNumber) orders[idx].trackingNumber = trackingNumber;
        } else if (status === 'delivered') {
          orders[idx].deliveredAt = now;
        } else if (status === 'customer_received') {
          orders[idx].customerReceivedAt = now;
        }
        writeOrdersFile(orders);
        updatedOrder = orders[idx];
      }
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Send SMS notification based on status
    const customerPhone = updatedOrder.customer?.phone || updatedOrder.shipping?.phone;
    if (isSmsConfigured() && customerPhone) {
      if (status === 'shipped') {
        sendOrderShippedSms(customerPhone, orderId, trackingNumber).then((result) => {
          if (result.success) {
            console.log(`[SMS] Shipped notification sent to ${customerPhone} for order ${orderId}`);
          } else {
            console.error(`[SMS] Failed to send shipped notification for order ${orderId}:`, result.error);
          }
        });
      } else if (status === 'delivered') {
        sendOrderDeliveredSms(customerPhone, orderId).then((result) => {
          if (result.success) {
            console.log(`[SMS] Delivered notification sent to ${customerPhone} for order ${orderId}`);
          } else {
            console.error(`[SMS] Failed to send delivered notification for order ${orderId}:`, result.error);
          }
        });
      }
    }

    return NextResponse.json(updatedOrder, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update order", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
