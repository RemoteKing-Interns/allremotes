import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { decryptPii, decryptPiiArray, emailHash } from "@/lib/pii-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!mongoEnabled()) {
      return NextResponse.json({
        totalAbandoned: 0,
        contacted: 0,
        recovered: 0,
        estimatedRevenue: 0,
        averageCartValue: 0
      });
    }

    const db = await getDb();
    const cartsCol = db.collection("carts");
    const ordersCol = db.collection("orders");

    const { searchParams } = new URL(request.url);
    const hoursThreshold = parseInt(searchParams.get("hours") || "24");
    const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    const baseQuery = {
      items: { $exists: true, $ne: [], $not: { $size: 0 } },
      lastActivity: { $lt: thresholdDate.toISOString() }
    };

    const allAbandoned = await cartsCol.find(baseQuery).toArray();
    const totalAbandoned = allAbandoned.length;
    const contacted = allAbandoned.filter(c => c.abandoned === true).length;
    const pending = totalAbandoned - contacted;

    const estimatedRevenue = allAbandoned.reduce((sum, cart) => {
      return sum + (cart.items || []).reduce((itemSum: number, item: any) => {
        return itemSum + (item.price || 0) * (item.quantity || 1);
      }, 0);
    }, 0);

    const averageCartValue = totalAbandoned > 0 ? estimatedRevenue / totalAbandoned : 0;

    // Recovered: carts where the customer eventually placed an order with matching email/userId
    const allAbandonedDecrypted = decryptPiiArray(allAbandoned, ["email"]);
    const emails = allAbandonedDecrypted.map(c => c.email).filter(Boolean);
    const userIds = allAbandonedDecrypted.map(c => c.userId).filter(Boolean);
    const emailHashes = emails.map(e => emailHash(e));
    const recoveredOrders = await ordersCol.countDocuments({
      $or: [
        ...(emailHashes.length ? [{ "customer.emailHash": { $in: emailHashes } }] : []),
        ...(userIds.length ? [{ userId: { $in: userIds } }] : [])
      ],
      createdAt: { $gte: thresholdDate.toISOString() }
    });

    return NextResponse.json({
      totalAbandoned,
      pending,
      contacted,
      recovered: recoveredOrders,
      estimatedRevenue,
      averageCartValue
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load stats", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
