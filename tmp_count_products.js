require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'allremotes';
const collectionName = process.env.MONGODB_COLLECTION || 'products';

if (!uri) {
  console.error('MONGODB_URI not set in .env.local');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const products = db.collection(collectionName);
    const total = await products.countDocuments();
    const withDescription = await products.countDocuments({ description: { $exists: true, $ne: '' } });
    const fields = ['description', 'features', 'specification', 'compatibility', 'instructions'];
    const query = { $and: fields.map((f) => ({ [f]: { $exists: true, $ne: '' } })) };
    const withAllFields = await products.countDocuments(query);
    const inLog = new Set([
      // Will be filled by the second script
    ]);
    console.log('Total products in DB:', total);
    console.log('With description:', withDescription);
    console.log('With all 5 content fields:', withAllFields);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
