import { Db, MongoClient } from "mongodb";

function getMongoUri() {
  return String(process.env.MONGODB_URI || "").trim();
}

function getMongoDbName() {
  return String(process.env.MONGODB_DB || "allremotes").trim() || "allremotes";
}

export function mongoEnabled() {
  if (String(process.env.MONGODB_DISABLED || "").trim() === "1") return false;
  return Boolean(getMongoUri());
}

declare global {
  // eslint-disable-next-line no-var
  var _allremotesMongoClientPromise: Promise<MongoClient> | undefined;
}

async function getMongoClient() {
  if (!mongoEnabled()) {
    throw new Error("MongoDB is not configured. Set MONGODB_URI.");
  }

  if (!global._allremotesMongoClientPromise) {
    const client = new MongoClient(getMongoUri());
    global._allremotesMongoClientPromise = client.connect().then(() => client);
  }

  return global._allremotesMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}

