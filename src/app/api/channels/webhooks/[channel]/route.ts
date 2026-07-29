import { NextResponse } from "next/server";
import type { Marketplace } from "@/lib/channels/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const channelName = channel as Marketplace;
  const body = await request.json().catch(() => null);
  console.log(`[webhook:${channelName}]`, body);
  return NextResponse.json({ ok: true, received: true, channel: channelName });
}

export async function GET(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const channelName = channel as Marketplace;
  console.log(`[webhook:GET:${channelName}]`, request.url);
  return NextResponse.json({ ok: true, received: true, channel: channelName });
}
