import { getDb, mongoEnabled } from "./mongo";
import { decryptPii } from "./pii-crypto";
import { findPreviouslyOrderedItems } from "./abandoned-carts";

export type AutoSendResult = {
  sent: number;
  skippedAlreadyOrdered: number;
  total: number;
  errors: string[];
  message?: string;
};

/**
 * Send abandonment-recovery emails (with a fresh single-use coupon) to all
 * carts inactive for longer than the threshold. Shared by the admin
 * "send all" button and the daily cron endpoint.
 */
export async function runAbandonedCartAutoSend(
  opts: { discountPercent?: number; hoursThreshold?: number } = {}
): Promise<AutoSendResult> {
  const discountPercent = Math.min(Math.max(1, Math.round(opts.discountPercent || 10)), 99);
  const hoursThreshold = opts.hoursThreshold && opts.hoursThreshold > 0 ? Math.floor(opts.hoursThreshold) : 24;

  if (!mongoEnabled()) {
    return { sent: 0, skippedAlreadyOrdered: 0, total: 0, errors: [], message: "MongoDB not enabled" };
  }

  const db = await getDb();
  const cartsCol = db.collection("carts");
  const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

  const pendingCarts = await cartsCol
    .find({
      items: { $exists: true, $ne: [], $not: { $size: 0 } },
      lastActivity: { $lt: thresholdDate.toISOString() },
      abandoned: { $ne: true }
    })
    .toArray();

  let sent = 0;
  let skippedAlreadyOrdered = 0;
  const errors: string[] = [];

  for (const cart of pendingCarts) {
    if (!cart.email) continue;
    try {
      // Don't discount items the customer already bought — mark the cart so
      // it drops out of future pending runs too.
      const alreadyOrdered = await findPreviouslyOrderedItems(db, cart);
      if (alreadyOrdered.length > 0) {
        await cartsCol.updateOne(
          { _id: cart._id },
          { $set: { abandoned: true, alreadyOrdered, updatedAt: new Date().toISOString() } }
        );
        skippedAlreadyOrdered++;
        continue;
      }
    } catch (err: any) {
      errors.push(`${cart.email}: order check failed — ${err.message}`);
      continue;
    }
    decryptPii(cart, ["email"]);
    try {
      const couponCode = `SAVE${discountPercent}${Date.now().toString(36).toUpperCase()}${sent}`;

      const couponResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          discountPercent,
          validDays: 7,
          maxUses: 1,
          customerEmail: cart.email,
          customerUserId: cart.userId
        })
      });

      if (!couponResp.ok) throw new Error("Failed to create coupon");

      const emailResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/abandoned-cart-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cart.email,
          couponCode,
          discountPercent,
          items: cart.items
        })
      });

      if (!emailResp.ok) throw new Error("Failed to send email");

      await cartsCol.updateOne(
        { _id: cart._id },
        { $set: { abandoned: true, contactedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }
      );

      sent++;
    } catch (err: any) {
      errors.push(`${cart.email}: ${err.message}`);
    }
  }

  return { sent, skippedAlreadyOrdered, total: pendingCarts.length, errors: errors.slice(0, 10) };
}
