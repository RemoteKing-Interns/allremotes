import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ABANDONMENT_THRESHOLD_HOURS = 24;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursThreshold = parseInt(searchParams.get("hours") || String(ABANDONMENT_THRESHOLD_HOURS));
    const search = searchParams.get("search")?.trim().toLowerCase();
    const includeContacted = searchParams.get("includeContacted") === "true";

    if (!mongoEnabled()) {
      return NextResponse.json({ carts: [] });
    }

    const db = await getDb();
    const col = db.collection("carts");

    const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    const query: any = {
      items: { $exists: true, $ne: [], $not: { $size: 0 } },
      lastActivity: { $lt: thresholdDate.toISOString() }
    };

    if (!includeContacted) {
      query.abandoned = { $ne: true };
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { userId: { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
        { "items.id": { $regex: search, $options: "i" } }
      ];
    }

    const abandonedCarts = await col
      .find(query)
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
