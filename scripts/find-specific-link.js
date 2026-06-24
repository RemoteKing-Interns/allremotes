#!/usr/bin/env node
/**
 * Find specific "Click here for Video programming instructions" text
 * Run with: node scripts/find-specific-link.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/';
const DB_NAME = 'allremotes';

async function findLinks() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const products = db.collection('products');

    // Search for the exact text with various patterns
    const searchPatterns = [
      'Click here for Video programming instructions',
      'Click here',
      'click here',
      'CLICK HERE',
    ];

    for (const pattern of searchPatterns) {
      console.log(`\n=== Searching for: "${pattern}" ===`);
      
      const foundProducts = await products.find({
        $or: [
          { description: { $regex: pattern, $options: 'i' } },
          { instructions: { $regex: pattern, $options: 'i' } },
        ],
      }).toArray();

      if (foundProducts.length > 0) {
        console.log(`Found ${foundProducts.length} products:`);
        foundProducts.forEach((p) => {
          console.log(`\n  Product: ${p.name}`);
          console.log(`  ID: ${p.id}`);
          
          // Show the exact text found
          const descMatch = p.description?.match(new RegExp(`.{0,50}${pattern}.{0,50}`, 'gi'));
          const instMatch = p.instructions?.match(new RegExp(`.{0,50}${pattern}.{0,50}`, 'gi'));
          
          if (descMatch) {
            console.log(`  Description snippet: "${descMatch[0]}"`);
          }
          if (instMatch) {
            console.log(`  Instructions snippet: "${instMatch[0]}"`);
          }
        });
      } else {
        console.log('No products found with this pattern.');
      }
    }

    // Also do a raw check for "Beninca" product specifically
    console.log('\n\n=== Checking for Beninca product specifically ===');
    const beninca = await products.findOne({ name: /RK-BEN02B/i });
    if (beninca) {
      console.log('Found RK-BEN02B product');
      console.log('Description:', beninca.description?.substring(0, 500));
      console.log('...');
      console.log('Description end:', beninca.description?.substring(-500));
    } else {
      console.log('RK-BEN02B not found by name, searching for Beninca...');
      const benincaProducts = await products.find({ name: /Beninca/i }).toArray();
      console.log(`Found ${benincaProducts.length} Beninca products`);
      benincaProducts.forEach((p) => {
        console.log(`\n- ${p.name} (ID: ${p.id})`);
        if (p.description?.toLowerCase().includes('click')) {
          console.log('  Contains "click" in description');
        }
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

findLinks();
