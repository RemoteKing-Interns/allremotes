import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { encrypt, decryptPii, decryptPiiArray, emailHash } from "@/lib/pii-crypto";
import { matchCartItemsAgainstOrders } from "@/lib/abandoned-carts";

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
        { emailHash: emailHash(search) },
        { userId: { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
        { "items.id": { $regex: search, $options: "i" } }
      ];
    }

    const abandonedCarts = await col
      .find(query)
      .sort({ lastActivity: -1 })
      .toArray();

    const decryptedCarts = decryptPiiArray(abandonedCarts, ["email"]);

    // Flag carts whose items the customer has already ordered — one batched
    // orders lookup across all carts, matched per cart in memory.
    const hashes = Array.from(new Set(decryptedCarts.map((c: any) => c.emailHash).filter(Boolean)));
    const ordersByHash = new Map<string, any[]>();
    if (hashes.length > 0) {
      const orders = await db
        .collection("orders")
        .find({ "customer.emailHash": { $in: hashes }, status: { $ne: "cancelled" } }, { projection: { "customer.emailHash": 1, items: 1 } })
        .toArray();
      for (const o of orders) {
        const h = o?.customer?.emailHash;
        if (!h) continue;
        const list = ordersByHash.get(h) || [];
        list.push(o);
        ordersByHash.set(h, list);
      }
    }
    for (const cart of decryptedCarts) {
      (cart as any).alreadyOrderedItems = matchCartItemsAgainstOrders(
        cart.items,
        ordersByHash.get(cart.emailHash) || []
      );
    }

    return NextResponse.json({ carts: decryptedCarts });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load abandoned carts", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
