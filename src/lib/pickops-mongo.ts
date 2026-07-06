import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

const uri = process.env.PICKOPS_MONGODB_URI;
const dbName = process.env.PICKOPS_MONGODB_DB || "pickops";

export function pickopsMongoEnabled(): boolean {
  return Boolean(uri);
}

export async function getPickopsDb(): Promise<Db> {
  if (!uri) throw new Error("PICKOPS_MONGODB_URI is not configured");
  if (db && client) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}
