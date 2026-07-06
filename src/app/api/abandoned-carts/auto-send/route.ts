import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const discountPercent = Math.min(Math.max(1, parseInt(body.discountPercent) || 10), 99);
    const hoursThreshold = parseInt(body.hours) || 24;

    if (!mongoEnabled()) {
      return NextResponse.json({ sent: 0, message: "MongoDB not enabled" });
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
    const errors: string[] = [];

    for (const cart of pendingCarts) {
      if (!cart.email) continue;
      try {
        const couponCode = `SAVE${discountPercent}${Date.now().toString(36).toUpperCase()}${sent}`;

        const couponResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/coupons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: couponCode,
            discountPercent,
            validDays: 7,
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

    return NextResponse.json({ sent, total: pendingCarts.length, errors: errors.slice(0, 10) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Auto-send failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
