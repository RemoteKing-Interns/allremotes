import { NextResponse } from "next/server";
import { getChannelAuditLogs } from "@/lib/channels/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel") || undefined;
  const limit = Number(searchParams.get("limit") || "100");

  try {
    const logs = await getChannelAuditLogs(channel, limit);
    return NextResponse.json({ ok: true, logs });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load audit logs", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
