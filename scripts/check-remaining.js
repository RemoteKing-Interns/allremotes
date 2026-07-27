const { MongoClient } = require('mongodb');
async function main() {
  const uri = process.argv[2];
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('allremotes');
  const col = db.collection('products');
  const skus = ['AR-RMDB04B', 'AR-RSL02C', 'AR-RMDB01B', 'AR-RCG01B', 'AR-FR60', 'AR-RCG02B', 'AR-RNG04B', 'AR-RCM48', 'AR-RCG10C', 'AR-ZIG4W'];
  for (const sku of skus) {
    const doc = await col.findOne({ sku });
    if (!doc) { console.log(sku + ': NOT FOUND'); continue; }
    const issues = [];
    for (const field of ['description', 'features', 'specification', 'compatibility', 'instructions']) {
      const val = doc[field] || '';
      if (val.includes('SEO:')) issues.push(field + ':SEO');
      if (val.includes('quality-tested option')) issues.push(field + ':quality');
      if (val.includes('Why choose All Remotes')) issues.push(field + ':marketing');
      if (val.includes('Battery \u2014')) issues.push(field + ':dash');
      if (val.includes('\u2014') && !field.includes('description')) issues.push(field + ':emdash');
    }
    console.log(sku + ': ' + (issues.length > 0 ? issues.join(', ') : 'CLEAN'));
  }
  await client.close();
}
main();