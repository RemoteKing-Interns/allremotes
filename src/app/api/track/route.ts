import { NextRequest, NextResponse } from "next/server";
import { liveViewStore } from "@/lib/live-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["heartbeat", "page_view", "product_view", "add_to_cart", "checkout_start", "purchase", "search"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as any;
    const { sessionId, type = "heartbeat", page, title, metadata, device } = body || {};

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const path = typeof page === "string" && page ? page : "/";

    if (type === "heartbeat") {
      liveViewStore.heartbeat(sessionId, path, { device });
      return NextResponse.json({ ok: true });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    // Update active session and record the action.
    liveViewStore.heartbeat(sessionId, path, { device });
    liveViewStore.recordActivity(sessionId, type, path, title, metadata);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid request" }, { status: 400 });
  }
}
