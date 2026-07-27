const { MongoClient } = require('mongodb');
async function main() {
  const uri = process.argv[2];
  const skus = process.argv.slice(3);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('allremotes');
  const col = db.collection('products');
  let fixed = 0;
  for (const sku of skus) {
    const doc = await col.findOne({ sku });
    if (!doc) { console.log(sku + ': NOT FOUND'); continue; }
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
      fixed++;
    } else {
      console.log(sku + ': CLEAN');
    }
  }
  console.log('Total fixed: ' + fixed + ' / ' + skus.length);
  await client.close();
}
const args = process.argv.slice(2);
if (args.length < 1) { console.error('Usage: node fix-marketing.js <uri> [sku1] [sku2] ...'); process.exit(1); }
main();