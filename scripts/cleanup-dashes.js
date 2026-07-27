const { MongoClient } = require('mongodb');
async function main() {
  const uri = process.argv[2];
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('allremotes');
  const col = db.collection('products');
  const cursor = col.find({});
  let fixed = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const sku = doc.sku;
    const updates = {};
    let changed = false;
    for (const field of ['description', 'features', 'specification', 'compatibility', 'instructions']) {
      let val = doc[field] || '';
      const orig = val;
      val = val.replace(/—/g, '-').replace(/Battery -/g, 'Battery Included');
      if (val !== orig) {
        updates[field] = val;
        changed = true;
      }
    }
    if (changed) {
      await col.updateOne({ sku }, { $set: updates });
      fixed++;
    }
  }
  console.log('Fixed dash issues in: ' + fixed + ' products');
  await client.close();
}
main();