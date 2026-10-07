import fs from "fs";
import path from "path";
import { getDb, mongoEnabled } from "./mongo";
import { sendOrderConfirmationSms, isSmsConfigured } from "./sms";
import { sendOrderConfirmationEmail, sendNewOrderNotification } from "./email";
import { encryptPii, decryptPii, emailHash, PII_FIELDS } from "./pii-crypto";

const ORDERS_JSON_PATH = path.resolve(process.cwd(), "orders.json");

export type OrderDoc = Record<string, any> & {
  id: string;
  createdAt: string;
  updatedAt?: string;
};

export async function makeOrderId(): Promise<string> {
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

export function readOrdersFile(): OrderDoc[] {
  try {
    const raw = fs.readFileSync(ORDERS_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrderDoc[]) : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

export function writeOrdersFile(orders: OrderDoc[]) {
  fs.writeFileSync(ORDERS_JSON_PATH, JSON.stringify(orders, null, 2) + "\n", "utf8");
}

/**
 * Find an order that was already created for a Stripe checkout session.
 * Used for idempotency between the client-side success-page creation and
 * the webhook safety net.
 */
export async function findOrderBySessionId(sessionId: string): Promise<OrderDoc | null> {
  if (!sessionId) return null;
  if (mongoEnabled()) {
    const db = await getDb();
    const doc = await db.collection("orders").findOne({ "payment.sessionId": sessionId });
    if (doc) {
      decryptPii(doc as any, PII_FIELDS.order);
      return doc as unknown as OrderDoc;
    }
    return null;
  }
  const orders = readOrdersFile();
  const found = orders.find((o) => o?.payment?.sessionId === sessionId);
  return found ? { ...found } : null;
}

/**
 * Create an order record (DB write, coupon usage, confirmation SMS/emails).
 * Shared by POST /api/orders and the Stripe webhook so both paths behave
 * identically. `notify: false` is for admin/manual orders.
 */
export async function createOrderRecord(
  body: Record<string, any>,
  opts: { notify?: boolean } = {}
): Promise<OrderDoc> {
  const notify = opts.notify !== false;

  const now = new Date().toISOString();
  const order: OrderDoc = {
    ...body,
    id: await makeOrderId(),
    createdAt: now,
    updatedAt: now,
  };

  // Store plaintext copies for emails/SMS before encrypting
  const plaintextCustomerEmail = order.customer?.email;
  const plaintextCustomerName = order.customer?.fullName || order.customer?.name;
  const plaintextCustomerPhone = order.customer?.phone || order.shipping?.phone;
  const plaintextShippingAddress = [
    order.shipping?.address,
    [order.shipping?.city, order.shipping?.state, order.shipping?.zipCode]
      .filter(Boolean)
      .join(" "),
    order.shipping?.country,
  ].filter(Boolean).join("\n");

  // Add emailHash for searchable email field
  if (order.customer?.email) {
    if (!order.customer) order.customer = {} as any;
    (order.customer as any).emailHash = emailHash(order.customer.email);
  }

  // Encrypt PII before storing
  encryptPii(order, PII_FIELDS.order);

  if (mongoEnabled()) {
    const db = await getDb();
    const col = db.collection("orders");
    await col.insertOne({ ...(order as any) });

    // Self-healing dedup: if the client success page and the webhook raced
    // and both inserted for the same checkout session, keep the earliest.
    const sessionId = order.payment?.sessionId;
    if (sessionId) {
      const dupes = await col
        .find({ "payment.sessionId": sessionId })
        .sort({ createdAt: 1 })
        .toArray();
      if (dupes.length > 1) {
        const keep = dupes[0];
        const loser = dupes.find((d: any) => String(d._id) !== String(keep._id));
        if (loser && String((order as any)._id) === String(loser._id)) {
          await col.deleteOne({ _id: loser._id });
          decryptPii(keep as any, PII_FIELDS.order);
          return keep as unknown as OrderDoc;
        }
      }
    }
  } else {
    const orders = readOrdersFile();
    if (order.payment?.sessionId) {
      const existing = orders.find((o) => o.payment?.sessionId === order.payment!.sessionId);
      if (existing) {
        return existing;
      }
    }
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

  // Send SMS confirmation if phone number provided
  if (notify && isSmsConfigured() && plaintextCustomerPhone && order.total != null) {
    const formattedTotal = typeof order.total === 'number'
      ? `AU$${order.total.toFixed(2)}`
      : order.total;

    try {
      const result = await sendOrderConfirmationSms(plaintextCustomerPhone, order.id, formattedTotal);
      if (result.success) {
        console.log(`[SMS] Order confirmation sent to ${plaintextCustomerPhone} for order ${order.id}`);
      } else {
        console.error(`[SMS] Failed to send confirmation for order ${order.id}:`, result.error);
      }
    } catch (smsError) {
      console.error(`[SMS] Order SMS error for ${order.id}:`, smsError);
    }
  }

  // Send order confirmation emails (non-blocking)
  if (notify && plaintextCustomerEmail && plaintextCustomerName && Array.isArray(order.items) && order.items.length > 0) {
    const emailItems = order.items.map((item: any) => ({
      name: String(item.name),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price ?? item.unitPrice ?? 0),
    }));

    const orderTotal = Number(order.pricing?.total ?? order.total ?? 0);

    try {
      const [customerResult, adminResult] = await Promise.all([
        sendOrderConfirmationEmail({
          to: plaintextCustomerEmail,
          orderId: order.id,
          customerName: plaintextCustomerName,
          items: emailItems,
          total: orderTotal,
          shippingAddress: plaintextShippingAddress,
        }),
        sendNewOrderNotification({
          to: "shane@allremotes.com.au",
          orderId: order.id,
          customerName: plaintextCustomerName,
          customerEmail: plaintextCustomerEmail,
          total: orderTotal,
          items: order.items.map((item: any) => `${item.name} x${item.quantity || 1}`),
        }),
      ]);
      if (!customerResult.success) {
        console.error(`[Email] Customer confirmation failed for ${order.id}:`, customerResult.error);
      } else {
        console.log(`[Email] Customer confirmation sent for order ${order.id}`);
      }
      if (!adminResult.success) {
        console.error(`[Email] Admin notification failed for ${order.id}:`, adminResult.error);
      } else {
        console.log(`[Email] Admin notification sent for order ${order.id}`);
      }
    } catch (emailError) {
      console.error(`[Email] Order email error for ${order.id}:`, emailError);
    }
  }

  return order;
}
