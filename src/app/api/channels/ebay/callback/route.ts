import { NextResponse } from "next/server";
import { eBayAdapter } from "@/lib/channels/ebay";
import { verifyState } from "@/lib/channels/crypto";
import { saveMarketplaceAccount } from "@/lib/channels/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.json(
      { error: "eBay authorization failed", details: errorDescription || error },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  if (!verifyState(state)) {
    return NextResponse.json({ error: "Invalid or expired state" }, { status: 403 });
  }

  try {
    const credentials = await eBayAdapter.exchangeCode(code);
    await saveMarketplaceAccount({
      channel: "ebay",
      connected: true,
      credentials,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, channel: "ebay", connected: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to connect eBay account", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
