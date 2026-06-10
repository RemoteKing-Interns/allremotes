require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/allremotes';
const client = new MongoClient(uri);

async function removeCatFields() {
  console.log('\n=====================================');
  console.log('    REMOVE CAT1/CAT2 FIELDS FROM MONGODB');
  console.log('=====================================\n');

  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('products');

    // Find all products with cat1 or cat2 fields
    const productsWithCatFields = await collection.find({
      $or: [
        { cat1: { $exists: true } },
        { cat2: { $exists: true } }
      ]
    }).toArray();

    console.log(`📊 Found ${productsWithCatFields.length} products with cat1/cat2 fields`);

    if (productsWithCatFields.length === 0) {
      console.log('✅ No cat1/cat2 fields found - database is clean!');
      return;
    }

    // Show sample of what will be removed
    console.log('\n📋 Sample products before cleanup:');
    productsWithCatFields.slice(0, 3).forEach((p, i) => {
      console.log(`   ${i + 1}. SKU: ${p.sku || 'N/A'}`);
      console.log(`      - cat1: "${p.cat1}"`);
      console.log(`      - cat2: "${p.cat2}"`);
      console.log(`      - category: "${p.category}"`);
    });

    // Remove cat1 and cat2 fields from all products
    const result = await collection.updateMany(
      {},
      {
        $unset: {
          cat1: '',
          cat2: ''
        }
      }
    );

    console.log(`\n🗑️  Removed cat1/cat2 fields:`);
    console.log(`   - Modified ${result.modifiedCount} documents`);
    console.log(`   - Matched ${result.matchedCount} documents`);

    // Verify removal
    const remaining = await collection.find({
      $or: [
        { cat1: { $exists: true } },
        { cat2: { $exists: true } }
      ]
    }).toArray();

    console.log(`\n✅ Verification: ${remaining.length} products still have cat1/cat2 fields`);

    if (remaining.length > 0) {
      console.log('\n⚠️  Some products still have cat1/cat2 fields:');
      remaining.forEach((p) => {
        console.log(`   - SKU: ${p.sku || 'N/A'}, ID: ${p.id}`);
      });
    } else {
      console.log('\n🎉 All cat1/cat2 fields have been successfully removed!');
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('\n=====================================');
    console.log('    CLEANUP COMPLETE');
    console.log('=====================================\n');
  }
}

removeCatFields();
