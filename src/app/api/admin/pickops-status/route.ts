import { NextResponse } from "next/server";
import { pickopsMongoEnabled, getPickopsDb } from "@/lib/pickops-mongo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!pickopsMongoEnabled()) {
    return NextResponse.json({ error: "PickOps MongoDB not configured" }, { status: 503 });
  }

  try {
    const { orderIds } = await request.json();
    if (!Array.isArray(orderIds)) {
      return NextResponse.json({ error: "orderIds must be an array" }, { status: 400 });
    }

    const db = await getPickopsDb();
    const collection = db.collection("warehouseOrders");

    // Fetch status for all requested order IDs
    const docs = await collection.find(
      { _id: { $in: orderIds } },
      { projection: { _id: 1, currentCustomStatus: 1, lastUpdatedAt: 1 } }
    ).toArray();

    // Build status map: orderId -> { status, lastUpdatedAt }
    const statusMap: Record<string, { status: string; lastUpdatedAt: string }> = {};
    docs.forEach((doc: any) => {
      statusMap[doc._id] = {
        status: doc.currentCustomStatus || doc.status || "pending",
        lastUpdatedAt: doc.lastUpdatedAt || doc.createdAt || null,
      };
    });

    return NextResponse.json({ statusMap });
  } catch (err: any) {
    console.error("[PickOps Status] Error:", err?.message);
    return NextResponse.json({ error: err?.message || "Failed to fetch PickOps status" }, { status: 500 });
  }
}
