import crypto from "crypto";
import { NextResponse } from "next/server";
import { runAbandonedCartAutoSend } from "@/lib/abandoned-cart-auto-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/**
 * Cron entry point for abandoned-cart recovery (triggered daily by the
 * GitHub Actions workflow "abandoned-cart-cron"). Protected by a shared
 * secret so the endpoint cannot be abused to mass-email coupons.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ") || !safeEqual(auth.slice(7), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await runAbandonedCartAutoSend({
      discountPercent: parseInt(body?.discountPercent) || 10,
      hoursThreshold: parseInt(body?.hours) || 24,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Auto-send failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
