require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'allremotes';

if (!uri) {
  console.error('MONGODB_URI not set in .env.local');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('documentTemplates');
    const doc = await col.findOne({ _id: 'packing-slip' });
    if (doc && doc.html) {
      const html = doc.html
        .replace(/(\{\{buyerEmail\}\})\s*<br\/?>\s*Username:\s*\{\{buyerUsername\}\}/g, '$1')
        .replace(/Username:\s*\{\{buyerUsername\}\}/g, '');
      await col.updateOne({ _id: 'packing-slip' }, { $set: { html, updatedAt: new Date().toISOString() } });
      console.log('DB packing-slip updated');
    } else {
      console.log('No packing-slip template in DB');
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
