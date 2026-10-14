import { NextRequest, NextResponse } from "next/server";
import { liveViewStore } from "@/lib/live-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const days = Number(new URL(request.url).searchParams.get("days") || 0);
    if (days > 0) {
      return NextResponse.json(await liveViewStore.getHistoryStats(Math.min(days, 365)));
    }
    const stats = await liveViewStore.getStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
