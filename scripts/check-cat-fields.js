require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/allremotes';
const client = new MongoClient(uri);

function getDbName() {
  const explicit = String(process.env.MONGODB_DB || '').trim();
  if (explicit) return explicit;
  
  // Infer from URI
  try {
    const withoutQuery = uri.split('?')[0] || '';
    const slashIndex = withoutQuery.lastIndexOf('/');
    if (slashIndex === -1) return 'allremotes';
    const dbPart = withoutQuery.slice(slashIndex + 1).trim();
    if (!dbPart || dbPart.includes('@')) return 'allremotes';
    return dbPart;
  } catch {
    return 'allremotes';
  }
}

async function check() {
  await client.connect();
  const dbName = getDbName();
  console.log('Using database:', dbName);
  const db = client.db(dbName);
  const collection = db.collection('products');
  
  const withCat1 = await collection.countDocuments({ cat1: { $exists: true } });
  const withCat2 = await collection.countDocuments({ cat2: { $exists: true } });
  const withCategory = await collection.countDocuments({ category: { $exists: true } });
  const total = await collection.countDocuments();
  
  console.log('\n=====================================');
  console.log('    DATABASE CATEGORY FIELD CHECK');
  console.log('=====================================\n');
  console.log('Products with cat1 field:', withCat1);
  console.log('Products with cat2 field:', withCat2);
  console.log('Products with category field:', withCategory);
  console.log('Total products:', total);
  
  if (withCat1 === 0 && withCat2 === 0) {
    console.log('\n✅ SUCCESS: No cat1/cat2 fields in database!');
  } else {
    console.log('\n⚠️  WARNING: Some products still have cat1/cat2 fields');
  }
  
  // Show sample
  const sample = await collection.findOne({ category: { $exists: true } });
  console.log('\nSample product:');
  console.log(JSON.stringify({ 
    sku: sample.sku, 
    category: sample.category,
    hasCat1: sample.cat1 !== undefined,
    hasCat2: sample.cat2 !== undefined
  }, null, 2));
  
  await client.close();
}

check().catch(console.error);
