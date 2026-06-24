import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ABANDONMENT_THRESHOLD_HOURS = 24;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursThreshold = parseInt(searchParams.get("hours") || String(ABANDONMENT_THRESHOLD_HOURS));

    if (!mongoEnabled()) {
      return NextResponse.json({ carts: [] });
    }

    const db = await getDb();
    const col = db.collection("carts");

    const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    const abandonedCarts = await col
      .find({
        items: { $exists: true, $ne: [], $not: { $size: 0 } },
        lastActivity: { $lt: thresholdDate.toISOString() },
        abandoned: { $ne: true }
      })
      .sort({ lastActivity: -1 })
      .toArray();

    return NextResponse.json({ carts: abandonedCarts });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load abandoned carts", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
