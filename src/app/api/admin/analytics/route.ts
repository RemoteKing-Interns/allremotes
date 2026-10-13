import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const range = new URL(request.url).searchParams.get("range") || "30d";
  const days = { "7d": 7, "30d": 30, "90d": 90 }[range] || 30;
  try {
    const { getGA4Dashboard } = await import("@/lib/google-analytics");
    return NextResponse.json(await getGA4Dashboard(days));
  } catch (error: any) {
    const message = String(error?.message || error);
    return NextResponse.json({ error: message }, { status: /not configured|credentials/.test(message) ? 503 : 502 });
  }
}
