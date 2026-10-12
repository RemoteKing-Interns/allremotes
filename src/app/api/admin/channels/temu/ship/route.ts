import { NextResponse } from "next/server";
import { getValidCredentials } from "@/lib/channels/db";
import { temuMarkOrderShipped } from "@/lib/channels/temu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Marks a TEMU order shipped on the marketplace with the seller's own
// tracking number. orderId accepts either our `TEMU-PO-…` id or the raw
// parentOrderSn.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const orderId = String(body?.orderId || "").trim();
    const trackingNumber = String(body?.trackingNumber || "").trim();
    if (!orderId || !trackingNumber) {
      return NextResponse.json({ error: "orderId and trackingNumber are required" }, { status: 400 });
    }

    const parentOrderSn = orderId.replace(/^TEMU-/i, "");
    const creds = await getValidCredentials("temu");
    const result = await temuMarkOrderShipped(parentOrderSn, trackingNumber, creds);
    return NextResponse.json({ ok: true, parentOrderSn, result });
  } catch (err: any) {
    return NextResponse.json(
      { error: "TEMU ship confirm failed", details: err?.message || String(err) },
      { status: 502 }
    );
  }
}
