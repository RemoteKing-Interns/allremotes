import { NextRequest, NextResponse } from "next/server";
import { liveViewStore } from "@/lib/live-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const secs = Number(params.get("secs") || 0);
    const days = Number(params.get("days") || 0);
    if (secs >= 30 || days > 0) {
      const windowDays = secs >= 30 ? secs / 86400 : Math.min(days, 365);
      return NextResponse.json(await liveViewStore.getHistoryStats(windowDays));
    }
    const stats = await liveViewStore.getStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
