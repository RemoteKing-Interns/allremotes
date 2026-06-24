import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, discountPercent, discountAmount, minPurchase, maxUses, validDays, customerEmail, customerUserId } = body;

    if (!code) {
      return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
    }

    if (!discountPercent && !discountAmount) {
      return NextResponse.json({ error: "Missing discount value" }, { status: 400 });
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ success: true, coupon: body });
    }

    const db = await getDb();
    const col = db.collection("coupons");

    const now = new Date();
    const expiresAt = validDays ? new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000).toISOString() : null;

    const coupon = {
      code: code.toUpperCase(),
      discountPercent: discountPercent || 0,
      discountAmount: discountAmount || 0,
      minPurchase: minPurchase || 0,
      maxUses: maxUses || null,
      usedCount: 0,
      validFrom: now.toISOString(),
      validUntil: expiresAt,
      customerEmail: customerEmail || null,
      customerUserId: customerUserId || null,
      isActive: true,
      createdAt: now.toISOString(),
    };

    await col.insertOne(coupon);

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create coupon", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const customerEmail = searchParams.get("customerEmail");
    const customerUserId = searchParams.get("customerUserId");

    if (!mongoEnabled()) {
      return NextResponse.json({ valid: false });
    }

    const db = await getDb();
    const col = db.collection("coupons");

    const query: any = { code: code?.toUpperCase(), isActive: true };
    
    if (customerEmail) query.customerEmail = customerEmail;
    if (customerUserId) query.customerUserId = customerUserId;

    const coupon = await col.findOne(query);

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Coupon not found" });
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({ valid: false, error: "Coupon not yet valid" });
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return NextResponse.json({ valid: false, error: "Coupon expired" });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" });
    }

    return NextResponse.json({ 
      valid: true, 
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        discountAmount: coupon.discountAmount,
        minPurchase: coupon.minPurchase,
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to validate coupon", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { code, incrementUsage } = body;

    if (!code) {
      return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ success: true });
    }

    const db = await getDb();
    const col = db.collection("coupons");

    if (incrementUsage) {
      await col.updateOne(
        { code: code.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update coupon", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
