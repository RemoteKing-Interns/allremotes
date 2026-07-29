import { getDb, mongoEnabled } from "@/lib/mongo";

export interface CategoryMapping {
  channel: string;
  internalCategory: string;
  externalCategoryId: string;
  externalCategoryName?: string;
  updatedAt: string;
}

const COLLECTION = "channelCategoryMappings";

export async function setCategoryMapping(
  channel: string,
  internalCategory: string,
  externalCategoryId: string,
  externalCategoryName?: string
): Promise<void> {
  if (!mongoEnabled()) return;
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { channel, internalCategory },
    {
      $set: {
        channel,
        internalCategory,
        externalCategoryId,
        externalCategoryName,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}

export async function getCategoryMapping(channel: string, internalCategory: string): Promise<string | undefined> {
  if (!mongoEnabled()) return undefined;
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ channel, internalCategory });
  return doc ? doc.externalCategoryId : undefined;
}

export async function getCategoryMappings(channel?: string): Promise<CategoryMapping[]> {
  if (!mongoEnabled()) return [];
  const db = await getDb();
  const filter = channel ? { channel } : {};
  return db
    .collection(COLLECTION)
    .find(filter)
    .toArray() as unknown as CategoryMapping[];
}
