#!/usr/bin/env node
/**
 * Script to check and clean "Click here" links from product descriptions/instructions
 * Run with: node scripts/clean-product-links.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/';
const DB_NAME = 'allremotes';

// Patterns to search for and remove
const PATTERNS_TO_REMOVE = [
  // "Click <a>here</a> for Video programming instructions" pattern
  /click\s*<a[^>]*>\s*here\s*<\/a>\s*for\s*video\s*programming\s+instructions\.?/gi,
  /click\s*<a[^>]*>\s*here\s*<\/a>\s*for\s*programming\s+instructions\.?/gi,
  /click\s*<a[^>]*>\s*here\s*<\/a>\s*for\s*video\s+instructions\.?/gi,
  /click\s*<a[^>]*>\s*here\s*<\/a>\s*for\s*instructions\.?/gi,
  // "Click here" as single text
  /click here for video programming instructions\.?/gi,
  /click here for programming instructions\.?/gi,
  /click here for video instructions\.?/gi,
  /click here for instructions\.?/gi,
  /click here\.?/gi,
  /<a[^>]*>\s*click here[^<]*<\/a>/gi,
  /<a[^>]*href="[^"]*"[^>]*>\s*click here[^<]*<\/a>/gi,
];

async function cleanProducts() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const products = db.collection('products');

    // Find all products
    const allProducts = await products.find({}).toArray();
    console.log(`\nFound ${allProducts.length} products`);

    let cleanedCount = 0;
    const foundPatterns = [];

    for (const product of allProducts) {
      let hasChanges = false;
      let description = product.description || '';
      let instructions = product.instructions || '';
      const originalDesc = description;
      const originalInst = instructions;

      // Check for patterns in description
      for (const pattern of PATTERNS_TO_REMOVE) {
        if (pattern.test(description)) {
          foundPatterns.push({
            productId: product.id,
            productName: product.name,
            field: 'description',
            matched: description.match(pattern)?.[0],
          });
          description = description.replace(pattern, '');
          hasChanges = true;
        }
      }

      // Check for patterns in instructions
      for (const pattern of PATTERNS_TO_REMOVE) {
        if (pattern.test(instructions)) {
          foundPatterns.push({
            productId: product.id,
            productName: product.name,
            field: 'instructions',
            matched: instructions.match(pattern)?.[0],
          });
          instructions = instructions.replace(pattern, '');
          hasChanges = true;
        }
      }

      // Clean up empty paragraphs and extra spaces
      if (hasChanges) {
        description = description
          .replace(/<p>\s*<\/p>/gi, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        instructions = instructions
          .replace(/<p>\s*<\/p>/gi, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        console.log(`\n--- Product: ${product.name} (ID: ${product.id}) ---`);
        if (originalDesc !== description) {
          console.log('Description changed:');
          console.log('  Before:', originalDesc.substring(0, 200) + (originalDesc.length > 200 ? '...' : ''));
          console.log('  After:', description.substring(0, 200) + (description.length > 200 ? '...' : ''));
        }
        if (originalInst !== instructions) {
          console.log('Instructions changed:');
          console.log('  Before:', originalInst.substring(0, 200) + (originalInst.length > 200 ? '...' : ''));
          console.log('  After:', instructions.substring(0, 200) + (instructions.length > 200 ? '...' : ''));
        }

        // Update the product
        await products.updateOne(
          { _id: product._id },
          {
            $set: {
              description: description,
              instructions: instructions,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        cleanedCount++;
      }
    }

    console.log('\n================================');
    console.log(`Total products checked: ${allProducts.length}`);
    console.log(`Products cleaned: ${cleanedCount}`);
    console.log(`\nFound links to remove:`);
    foundPatterns.forEach((item) => {
      console.log(`  - ${item.productName} (${item.field}): "${item.matched}"`);
    });

    if (cleanedCount === 0) {
      console.log('\nNo "click here" links found in any products.');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
cleanProducts();
