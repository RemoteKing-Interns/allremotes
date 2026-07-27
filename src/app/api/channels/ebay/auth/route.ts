import { NextResponse } from "next/server";
import { eBayAdapter } from "@/lib/channels/ebay";
import { signState } from "@/lib/channels/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = signState();
    const url = eBayAdapter.getAuthUrl(state);
    return NextResponse.json({ url, state });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate eBay auth URL", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
