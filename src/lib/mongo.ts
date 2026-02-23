import { Db, MongoClient } from "mongodb";

function getMongoUri() {
  return String(process.env.MONGODB_URI || "").trim();
}

function inferDbNameFromUri(uri: string) {
  try {
    const withoutQuery = uri.split("?")[0] || "";
    const slashIndex = withoutQuery.lastIndexOf("/");
    if (slashIndex === -1) return "";
    const dbPart = withoutQuery.slice(slashIndex + 1).trim();
    // Atlas URIs often end with "/" (no db specified).
    if (!dbPart) return "";
    // If the dbPart still contains "@" it's not a db name; it's an auth segment.
    if (dbPart.includes("@")) return "";
    return dbPart;
  } catch {
    return "";
  }
}

function getMongoDbName() {
  const explicit = String(process.env.MONGODB_DB || "").trim();
  if (explicit) return explicit;
  const inferred = inferDbNameFromUri(getMongoUri());
  return inferred || "allremotes";
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
