import { NextResponse } from "next/server";
import { getValidCredentials } from "@/lib/channels/db";
import { setEbayListingSku } from "@/lib/channels/ebay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const itemId = String(body?.itemId || "").trim();
    const sku = String(body?.sku || "").trim();
    const variationColor = body?.variationColor ? String(body.variationColor).trim() : undefined;
    if (!itemId || !sku) {
      return NextResponse.json({ error: "itemId and sku are required" }, { status: 400 });
    }
    const creds = await getValidCredentials("ebay");
    await setEbayListingSku(itemId, sku, creds.accessToken, variationColor);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
