import { NextResponse } from "next/server";
import { runAbandonedCartAutoSend } from "@/lib/abandoned-cart-auto-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
