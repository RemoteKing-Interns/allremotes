import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/channels";
import { signState } from "@/lib/channels/crypto";
import type { Marketplace } from "@/lib/channels/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const adapterChannel = channel as Marketplace;
  try {
    const adapter = getAdapter(adapterChannel);
    const state = signState();
    const url = adapter.getAuthUrl(state);
    return NextResponse.json({ url, state, channel: adapterChannel });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to generate ${adapterChannel} auth URL`, details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
