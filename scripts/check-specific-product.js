#!/usr/bin/env node
/**
 * Check specific Beninca product by various identifiers
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/';
const DB_NAME = 'allremotes';

async function checkProduct() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const products = db.collection('products');

    // Search by SKU
    console.log('=== Searching by SKU: AR-BEN02 ===');
    let product = await products.findOne({ sku: 'AR-BEN02' });
    
    if (!product) {
      console.log('Not found by SKU, searching by name...');
      product = await products.findOne({ name: /Beninca TO\.GO.*2Button/i });
    }
    
    if (!product) {
      console.log('Not found by name, searching all Beninca products...');
      const allBeninca = await products.find({ 
        $or: [
          { name: /Beninca/i },
          { brand: /Beninca/i }
        ]
      }).toArray();
      
      console.log(`\nFound ${allBeninca.length} Beninca products:\n`);
      allBeninca.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Name: ${p.name}`);
        console.log(`SKU: ${p.sku}`);
        console.log(`Description length: ${p.description?.length || 0}`);
        if (p.description?.toLowerCase().includes('click')) {
          console.log('*** CONTAINS "click" ***');
          // Find the exact position
          const idx = p.description.toLowerCase().indexOf('click');
          console.log(`Snippet: "${p.description.substring(Math.max(0, idx-50), idx+100)}"`);
        }
        console.log('---\n');
      });
      return;
    }

    // Found the product
    console.log('\n=== Product Found ===');
    console.log(`ID: ${product.id}`);
    console.log(`Name: ${product.name}`);
    console.log(`SKU: ${product.sku}`);
    console.log(`\nFull Description:\n${product.description}`);
    
    if (product.instructions) {
      console.log(`\nInstructions:\n${product.instructions}`);
    }

    // Check for click here
    if (product.description?.toLowerCase().includes('click')) {
      console.log('\n*** CONTAINS "click" in description ***');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkProduct();
