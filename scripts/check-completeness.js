const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/";

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db("allremotes");
    const col = db.collection("products");
    const products = await col.find({}).toArray();

    const requiredFields = ["description", "features", "specification", "compatibility", "instructions"];

    const complete = [];
    const incomplete = [];

    products.forEach((p) => {
      const allFields = requiredFields.every((f) => {
        const val = p[f];
        return val && String(val).trim().length > 100;
      });
      const missing = requiredFields.filter((f) => {
        const val = p[f];
        return !val || String(val).trim().length < 50;
      });

      if (allFields) {
        complete.push({ sku: p.sku, name: p.name });
      } else {
        incomplete.push({ sku: p.sku, name: p.name, missing });
      }
    });

    console.log("=== COMPLETE PRODUCTS ===");
    console.log(`Count: ${complete.length}`);
    complete.forEach((p) => console.log(`  ${p.sku} - ${p.name}`));

    console.log("\n=== INCOMPLETE PRODUCTS ===");
    console.log(`Count: ${incomplete.length}`);
    incomplete.forEach((p) => console.log(`  ${p.sku} - ${p.name} (missing: ${p.missing.join(", ")})`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
