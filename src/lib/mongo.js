import { MongoClient } from 'mongodb';

const options = {};

let client;
let clientPromise;

function getMongoUri() {
  return String(process.env.MONGODB_URI || '').trim();
}

export function mongoEnabled() {
  if (String(process.env.MONGODB_DISABLED || '').trim() === '1') return false;
  return Boolean(getMongoUri());
}

function getClientPromise() {
  if (!mongoEnabled()) {
    throw new Error('MongoDB is not configured. Set MONGODB_URI.');
  }

  const uri = getMongoUri();

  if (process.env.NODE_ENV === 'development') {
    // In development mode, preserve the client promise across HMR reloads.
    let globalWithMongo = global;
    globalWithMongo._mongoClientPromise = globalWithMongo._mongoClientPromise || undefined;

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
  }

  return clientPromise;
}

export default getClientPromise;

export async function getDb() {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB || 'allremotes';
  return client.db(dbName);
}
