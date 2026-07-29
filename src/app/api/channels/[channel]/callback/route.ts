import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/channels";
import { saveMarketplaceAccount } from "@/lib/channels/db";
import { verifyState } from "@/lib/channels/crypto";
import type { Marketplace } from "@/lib/channels/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const adapterChannel = channel as Marketplace;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const verified = state ? verifyState(state) : false;
  if (state && !verified) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  try {
    const adapter = getAdapter(adapterChannel);
    const credentials = await adapter.exchangeCode(code);
    await saveMarketplaceAccount({
      channel: adapterChannel,
      connected: true,
      credentials,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, channel: adapterChannel });
  } catch (err: any) {
    return NextResponse.json(
      { error: `${adapterChannel} callback failed`, details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
