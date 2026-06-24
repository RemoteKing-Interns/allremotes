const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'allremotes';

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function main() {
  console.log('=== MongoDB RK Data Update Script ===\n');

  // Step 1: Read Excel file
  console.log('Step 1: Reading Excel file...');
  const excelPath = path.join(__dirname, '../public/Gararge and Gate RK data.xlsx');
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = xlsx.utils.sheet_to_json(worksheet);
  console.log(`  ✓ Found ${excelData.length} rows in Excel file`);

  // Step 2: Build SKU lookup map
  console.log('\nStep 2: Building SKU lookup map...');
  const skuToRkData = new Map();
  excelData.forEach(row => {
    if (row['sku'] && row['RK-SKU']) {
      skuToRkData.set(row['sku'], {
        rk_sku: row['RK-SKU'],
        rk_url: row['RK_url']
      });
    }
  });
  console.log(`  ✓ Built lookup map with ${skuToRkData.size} SKU entries`);

  // Step 3: Connect to MongoDB
  console.log('\nStep 3: Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('  ✓ Connected to MongoDB');
  const db = client.db(MONGODB_DB);
  const productsCollection = db.collection('products');

  // Step 4: Read all products
  console.log('\nStep 4: Reading all products from database...');
  const allProducts = await productsCollection.find({}).toArray();
  console.log(`  ✓ Found ${allProducts.length} products in database`);

  // Step 5: Match and prepare updates
  console.log('\nStep 5: Matching products and preparing updates...');
  const updates = [];
  const matchedSkus = new Set();
  const unmatchedSkus = new Set();

  allProducts.forEach(product => {
    if (product.sku && skuToRkData.has(product.sku)) {
      const rkData = skuToRkData.get(product.sku);
      updates.push({
        filter: { _id: product._id },
        update: {
          $set: {
            rk_sku: rkData.rk_sku,
            rk_url: rkData.rk_url
          }
        },
        sku: product.sku,
        rk_sku: rkData.rk_sku
      });
      matchedSkus.add(product.sku);
    } else if (product.sku) {
      unmatchedSkus.add(product.sku);
    }
  });

  console.log(`  ✓ Matched ${updates.length} products for update`);
  console.log(`  - Unmatched product SKUs: ${unmatchedSkus.size}`);

  // Step 6: Execute updates
  console.log('\nStep 6: Executing MongoDB updates...');
  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    try {
      const result = await productsCollection.updateOne(update.filter, update.update);
      if (result.modifiedCount > 0) {
        successCount++;
        console.log(`  ✓ Updated: ${update.sku} → RK_SKU: ${update.rk_sku}`);
      } else {
        console.log(`  - No change: ${update.sku} (already has RK data)`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Error updating ${update.sku}:`, error.message);
    }
  }

  // Step 7: Verify updates
  console.log('\nStep 7: Verifying updates...');
  const updatedProducts = await productsCollection.find({ 
    rk_sku: { $exists: true, $ne: null }
  }).toArray();
  console.log(`  ✓ Verified: ${updatedProducts.length} products now have RK_SKU`);

  // Step 8: Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total products in DB: ${allProducts.length}`);
  console.log(`Excel rows with RK data: ${skuToRkData.size}`);
  console.log(`Products matched: ${updates.length}`);
  console.log(`Updates successful: ${successCount}`);
  console.log(`Updates failed: ${errorCount}`);
  console.log(`Products with RK_SKU: ${updatedProducts.length}`);

  if (unmatchedSkus.size > 0) {
    console.log(`\nUnmatched product SKUs (first 20):`);
    Array.from(unmatchedSkus).slice(0, 20).forEach(sku => {
      console.log(`  - ${sku}`);
    });
  }

  // Close connection
  await client.close();
  console.log('\n✓ MongoDB connection closed');
}

main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
