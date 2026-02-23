const { MongoClient } = require('mongodb');

let clientPromise;

function getMongoUri() {
  return String(process.env.MONGODB_URI || '').trim();
}

function getMongoDbName() {
  return String(process.env.MONGODB_DB || 'allremotes').trim() || 'allremotes';
}

function mongoEnabled() {
  if (String(process.env.MONGODB_DISABLED || '').trim() === '1') return false;
  return Boolean(getMongoUri());
}

async function getMongoClient() {
  if (!mongoEnabled()) {
    throw new Error('MongoDB is not configured. Set MONGODB_URI.');
  }
  if (!clientPromise) {
    const client = new MongoClient(getMongoUri());
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}

async function getDb() {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}

module.exports = {
  mongoEnabled,
  getDb,
};
