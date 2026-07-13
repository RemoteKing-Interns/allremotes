/**
 * Database cleanup script to remove dummy brand images from all products
 * Run this script once to clean up KeyDiy.png, Lonsdor.png, Xhorse.png, GTL.png from MongoDB
 */

import dotenv from "dotenv";
import { getDb } from "../lib/mongo";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const DUMMY_IMAGE_PATTERNS = ['KeyDiy.png', 'Lonsdor.png', 'Xhorse.png', 'GTL.png'];

function isDummyImage(img: string): boolean {
  if (typeof img !== 'string' || !img.trim()) return false;

  // Extract filename from URL; keep query parameters so uploaded images
  // (e.g. Lonsdor.png?v=123) are not mistaken for old dummy placeholders.
  const filename = img.split('/').pop();
  if (!filename) return false;

  // Check if it's a dummy image
  return DUMMY_IMAGE_PATTERNS.includes(filename);
}

async function cleanupDummyImages() {
  try {
    console.log('Starting dummy image cleanup...');
    
    const db = await getDb();
    const col = db.collection("products");
    
    // Get all products
    const products = await col.find({}).toArray();
    console.log(`Found ${products.length} products to check`);
    
    let updatedCount = 0;
    let totalRemoved = 0;
    
    for (const product of products) {
      const productId = product.id;
      let images = product.images || [];
      let image = product.image || "";
      
      // Filter images array
      const originalImageCount = images.length;
      images = images.filter((img: string) => !isDummyImage(img));
      const imagesRemoved = originalImageCount - images.length;
      
      // Check single image field
      if (isDummyImage(image)) {
        image = "";
        totalRemoved++;
      }
      
      // Only update if changes were made
      if (imagesRemoved > 0 || (product.image && isDummyImage(product.image))) {
        await col.updateOne(
          { id: productId },
          {
            $set: {
              images: images,
              image: images.length > 0 ? images[0] : image,
            },
          }
        );
        updatedCount++;
        totalRemoved += imagesRemoved;
        console.log(`Updated product ${productId}: removed ${imagesRemoved} dummy images`);
      }
    }
    
    console.log(`\nCleanup complete!`);
    console.log(`- Products updated: ${updatedCount}`);
    console.log(`- Total dummy images removed: ${totalRemoved}`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDummyImages().then(() => {
  console.log('Script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
