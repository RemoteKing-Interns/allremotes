import { NextResponse } from "next/server";
import { getStarshipitTracking, starshipitConfigured } from "@/lib/starshipit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!starshipitConfigured()) {
      return NextResponse.json({ error: "Starshipit not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order_number");

    if (!orderNumber) {
      return NextResponse.json({ error: "order_number is required" }, { status: 400 });
    }

    const tracking = await getStarshipitTracking(orderNumber);

    if (!tracking) {
      return NextResponse.json({ error: "No tracking data found for this order" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tracking });
  } catch (err: any) {
    console.error("Starshipit tracking error:", err?.message);
    return NextResponse.json(
      { error: "Failed to fetch tracking", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
