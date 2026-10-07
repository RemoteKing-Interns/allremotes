import { getDb, mongoEnabled } from "./mongo";

/**
 * Server-side stash of orders awaiting payment confirmation. Written by
 * create-checkout-session when the Stripe session is created, read by the
 * Stripe webhook if the client's browser never makes it back to
 * /order-success (crashed tab, blocked redirect, cleared sessionStorage).
 * Documents expire after 7 days via TTL index.
 */
const COLLECTION = "pending_orders";
const TTL_SECONDS = 60 * 60 * 24 * 7;

export async function stashPendingOrder(sessionId: string, orderBody: Record<string, any>) {
  if (!sessionId || !mongoEnabled()) return;
  try {
    const db = await getDb();
    const col = db.collection(COLLECTION);
    // Idempotent, cheap; only runs when a checkout session is created
    await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: TTL_SECONDS });
    await col.updateOne(
      { sessionId },
      { $set: { sessionId, body: orderBody, createdAt: new Date() } },
      { upsert: true }
    );
  } catch (err: any) {
    console.error(`Failed to stash pending order for ${sessionId}:`, err?.message || err);
  }
}

export async function readPendingOrder(sessionId: string): Promise<Record<string, any> | null> {
  if (!sessionId || !mongoEnabled()) return null;
  try {
    const db = await getDb();
    const doc = await db.collection(COLLECTION).findOne({ sessionId });
    return doc ? { ...doc, body: doc.body ?? doc } : null;
  } catch (err: any) {
    console.error(`Failed to read pending order for ${sessionId}:`, err?.message || err);
    return null;
  }
}

export async function deletePendingOrder(sessionId: string) {
  if (!sessionId || !mongoEnabled()) return;
  try {
    const db = await getDb();
    await db.collection(COLLECTION).deleteOne({ sessionId });
  } catch (err: any) {
    console.error(`Failed to delete pending order for ${sessionId}:`, err?.message || err);
  }
}
