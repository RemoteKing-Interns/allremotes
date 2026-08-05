import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/channels";
import { getValidCredentials, saveChannelOrder } from "@/lib/channels/db";
import type { Marketplace } from "@/lib/channels/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MARKETPLACES: Marketplace[] = ["ebay", "amazon", "temu", "aliexpress"];

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelParam = searchParams.get("channel");
    const sinceDays = Number(searchParams.get("sinceDays") || "7");
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

    const channels: Marketplace[] = channelParam
      ? ([channelParam as Marketplace].filter((c) => MARKETPLACES.includes(c)) as Marketplace[])
      : MARKETPLACES;

    if (channelParam && channels.length === 0) {
      return NextResponse.json({ error: `Unknown channel: ${channelParam}` }, { status: 400 });
    }

    const results: Record<string, { imported: number; error?: string }> = {};
    for (const channel of channels) {
      try {
        const creds = await getValidCredentials(channel);
        const adapter = getAdapter(channel);
        const orders = await adapter.fetchOrders(since, creds);
        for (const order of orders) {
          await saveChannelOrder(order);
        }
        results[channel] = { imported: orders.length };
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes("No connected account")) {
          results[channel] = { imported: 0, error: "No connected account" };
        } else if (msg.includes("not implemented")) {
          results[channel] = { imported: 0, error: "Sync not implemented" };
        } else {
          results[channel] = { imported: 0, error: msg };
        }
      }
    }

    return NextResponse.json({ ok: true, since: since.toISOString(), results });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to sync orders", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
