const { MongoClient } = require('mongodb');
async function main() {
  const uri = process.argv[2];
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('allremotes');
  const col = db.collection('products');
  
  const sku = process.argv[3];
  const doc = await col.findOne({ sku });
  if (!doc) { console.log(sku + ': NOT FOUND'); await client.close(); return; }
  
  let changed = false;
  const updates = {};
  
  for (const field of ['description', 'features', 'specification', 'compatibility', 'instructions']) {
    let val = doc[field] || '';
    const orig = val;
    val = val.replace(/SEO:[^<]*/g, '');
    val = val.replace(/quality-tested option for Australian homes and businesses\./g, '');
    val = val.replace(/Why choose All Remotes\?[\s\S]*?Friendly local support/g, '');
    val = val.replace(/ {2,}/g, ' ');
    if (val !== orig) { updates[field] = val; changed = true; }
  }
  
  if (changed) {
    await col.updateOne({ sku }, { $set: updates });
    console.log(sku + ': FIXED');
  } else {
    console.log(sku + ': NO CHANGES NEEDED');
  }
  
  await client.close();
}
main();