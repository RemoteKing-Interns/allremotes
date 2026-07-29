import { getDb, mongoEnabled } from "@/lib/mongo";

export interface ChannelAuditLog {
  channel: string;
  action: string;
  productId?: string;
  sku?: string;
  payload?: any;
  result?: any;
  error?: string;
  createdAt: string;
}

const COLLECTION = "channelAuditLogs";

export async function logChannelEvent(log: Omit<ChannelAuditLog, "createdAt">): Promise<void> {
  const entry: ChannelAuditLog = { ...log, createdAt: new Date().toISOString() };
  if (mongoEnabled()) {
    const db = await getDb();
    await db.collection(COLLECTION).insertOne(entry);
  } else {
    console.log("[channel-audit]", JSON.stringify(entry));
  }
}

export async function getChannelAuditLogs(channel?: string, limit = 100): Promise<ChannelAuditLog[]> {
  if (!mongoEnabled()) return [];
  const db = await getDb();
  const filter = channel ? { channel } : {};
  return db
    .collection(COLLECTION)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray() as unknown as ChannelAuditLog[];
}
