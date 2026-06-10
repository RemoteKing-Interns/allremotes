#!/usr/bin/env node
/**
 * Import products from Excel to MongoDB
 * 1. Clears existing products
 * 2. Reads Excel file
 * 3. Inserts new products
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configuration
const EXCEL_FILE = path.resolve(process.cwd(), 'public/Gararge and Gate RK data.xlsx');
const S3_BUCKET_URL = 'https://allremotes.s3.ap-southeast-2.amazonaws.com';
const MAX_IMAGES_PER_PRODUCT = 5;

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('   Set it with: $env:MONGODB_URI = "your-connection-string"');
  console.error('   Or create a .env.local file with MONGODB_URI="your-uri"');
  process.exit(1);
}

function generateS3ImageUrlsFromSku(sku) {
  if (!sku || typeof sku !== 'string') return [];
  const normalizedSku = sku.trim();
  if (!normalizedSku) return [];
  
  const imageUrls = [];
  for (let i = 1; i <= MAX_IMAGES_PER_PRODUCT; i++) {
    imageUrls.push(`${S3_BUCKET_URL}/images/${normalizedSku}-${i}.png`);
  }
  return imageUrls;
}

function normalizeSkuKey(sku) {
  if (!sku || typeof sku !== 'string') return '';
  return sku.trim().toLowerCase().replace(/\s+/g, '-');
}

function coercePrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) return num;
  return null;
}

function excelRowToProduct(row, index) {
  const sku = String(row.sku || '').trim();
  const title = String(row.title || row.Title || '').trim();
  const description = String(row.Description || row.description || '').trim();
  const features = String(row.Features || row.features || '').trim();
  const compatibility = String(row.Compatibility || row.compatibility || '').trim();
  const brand = String(row.Brand || row.brand || 'Generic').trim();
  const category = String(row.Category || row.category || 'Garage and Gate').trim();
  
  // Price parsing
  const price = coercePrice(row.price || row.Price);
  const comparePrice = coercePrice(row.comparePrice || row.comparePrice || row.compare_price);
  
  // Stock/Status
  const status = String(row.Status || row.status || 'Active').toLowerCase();
  const inStock = status === 'active' || status === 'in stock' || status === 'instock' || status === 'yes';
  
  // Quantity
  const quantity = Number(row.Quantity || row.quantity || 0);
  
  // Generate S3 image URLs from SKU
  const images = generateS3ImageUrlsFromSku(sku);
  
  // Other fields
  const frequency_mhz = row.frequency_mhz || row.Frequency || row.frequency || '';
  const buttons = row.buttons || row.Buttons || '';
  const seo_title = String(row.seo_title || row['SEO Title'] || title).trim();
  
  return {
    id: crypto.randomUUID(),
    sku,
    skuKey: normalizeSkuKey(sku),
    name: title,
    brand,
    category: category.toLowerCase().includes('garage') ? 'garage' : category.toLowerCase().includes('car') ? 'car' : 'all',
    price,
    comparePrice,
    inStock,
    stock: quantity,
    image: images[0] || '',
    images,
    imgIndex: 0,
    description,
    features,
    compatibility,
    condition: 'Brand New',
    returns: 'Returns accepted within 30 days. Must be in original, resaleable condition. Buyer pays return shipping.',
    seller: 'AllRemotes (100% positive)',
    frequency_mhz,
    buttons,
    seo_title,
    tags: String(row.tags || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function clearProductsCollection(client, dbName) {
  const db = client.db(dbName);
  const collection = db.collection('products');
  
  console.log('\n🗑️  Clearing existing products...');
  const result = await collection.deleteMany({});
  console.log(`   ✅ Deleted ${result.deletedCount} products`);
  return result;
}

async function importProducts(client, dbName, products) {
  const db = client.db(dbName);
  const collection = db.collection('products');
  
  console.log(`\n📥 Importing ${products.length} products...`);
  
  // Create indexes
  try {
    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ skuKey: 1 }, { unique: true, sparse: true });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ brand: 1 });
    console.log('   ✅ Indexes created');
  } catch (err) {
    console.warn('   ⚠️  Index creation warning (may already exist):', err.message);
  }
  
  // Insert products
  if (products.length > 0) {
    const result = await collection.insertMany(products);
    console.log(`   ✅ Inserted ${result.insertedCount} products`);
    return result;
  }
}

async function main() {
  console.log('=' .repeat(70));
  console.log('PRODUCT IMPORT TOOL - MongoDB');
  console.log('=' .repeat(70));
  
  // Check Excel file exists
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`\n❌ Excel file not found: ${EXCEL_FILE}`);
    process.exit(1);
  }
  
  // Read Excel file
  console.log('\n📖 Reading Excel file...');
  const workbook = xlsx.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet);
  
  console.log(`   ✅ Found ${rows.length} rows`);
  
  // Show column headers from first row
  if (rows.length > 0) {
    console.log('\n📋 Columns found:');
    Object.keys(rows[0]).forEach(col => console.log(`   - ${col}`));
  }
  
  // Transform to products
  console.log('\n🔄 Transforming to product format...');
  const products = rows
    .filter(row => row.sku || row.SKU) // Only include rows with SKU
    .map((row, index) => excelRowToProduct(row, index));
  
  console.log(`   ✅ ${products.length} valid products`);
  
  // Show sample
  console.log('\n📦 Sample product:');
  if (products.length > 0) {
    const sample = products[0];
    console.log(`   SKU: ${sample.sku}`);
    console.log(`   Name: ${sample.name}`);
    console.log(`   Brand: ${sample.brand}`);
    console.log(`   Price: $${sample.price}`);
    console.log(`   Images: ${sample.images.length} URLs`);
    console.log(`   Category: ${sample.category}`);
  }
  
  // Connect to MongoDB
  console.log('\n🔌 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  
  await client.connect();
  console.log('   ✅ Connected');
  
  // Infer DB name from URI
  const dbName = MONGODB_URI.split('/').pop()?.split('?')[0] || 'allremotes';
  console.log(`   Database: ${dbName}`);
  
  // Clear existing products
  await clearProductsCollection(client, dbName);
  
  // Import new products
  await importProducts(client, dbName, products);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n   Total products imported: ${products.length}`);
  console.log(`   Image URL pattern: ${S3_BUCKET_URL}/images/{sku}-N.png`);
  console.log(`   Database: ${dbName}`);
  
  await client.close();
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
