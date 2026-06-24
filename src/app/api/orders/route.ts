import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "../../../lib/mongo";
import { sendOrderConfirmationSms, sendOrderShippedSms, sendOrderDeliveredSms, isSmsConfigured } from "../../../lib/sms";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
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

async function makeOrderId(): Promise<string> {
  if (mongoEnabled()) {
    const db = await getDb();
    const result = await db.collection("counters").findOneAndUpdate(
      { _id: "orders" as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    const seq: number = (result as any)?.seq ?? (result as any)?.value?.seq ?? 1;
    return `ARSO-${String(seq).padStart(6, "0")}`;
  }
  // File-based fallback: count existing orders and add 1
  const existing = readOrdersFile();
  const seq = existing.length + 1;
  return `ARSO-${String(seq).padStart(6, "0")}`;
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
      if (email) query["customer.email"] = email.toLowerCase();
      if (orderId) query["id"] = { $regex: new RegExp(orderId.replace(/[#]/g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") };
      const orders = await col.find(query).sort({ createdAt: -1 }).toArray();
      
      return NextResponse.json(orders, { 
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

    const now = new Date().toISOString();
    const order: OrderDoc = {
      ...(body as Record<string, any>),
      id: await makeOrderId(),
      createdAt: now,
      updatedAt: now,
    };

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("orders");
      await col.insertOne({ ...(order as any) });
    } else {
      const orders = readOrdersFile();
      orders.push(order);
      writeOrdersFile(orders);
    }

    // Increment coupon usage if coupon was used
    if (mongoEnabled() && order.couponCode) {
      try {
        const db = await getDb();
        const couponsCol = db.collection("coupons");
        await couponsCol.updateOne(
          { code: order.couponCode.toUpperCase() },
          { $inc: { usedCount: 1 } }
        );
      } catch (err) {
        console.error("Failed to increment coupon usage:", err);
      }
    }

    // Send SMS confirmation if phone number provided (non-blocking)
    const customerPhone = order.customer?.phone || order.shipping?.phone;
    if (isSmsConfigured() && customerPhone && order.total != null) {
      const formattedTotal = typeof order.total === 'number' 
        ? `AU$${order.total.toFixed(2)}`
        : order.total;
      
      sendOrderConfirmationSms(customerPhone, order.id, formattedTotal).then((result) => {
        if (result.success) {
          console.log(`[SMS] Order confirmation sent to ${customerPhone} for order ${order.id}`);
        } else {
          console.error(`[SMS] Failed to send confirmation for order ${order.id}:`, result.error);
        }
      });
    }

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

export async function PUT(request: Request) {
  try {
    const { orderId, status, trackingNumber, customerEmail } = await request.json();

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
