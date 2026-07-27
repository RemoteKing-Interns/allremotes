const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/";

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db("allremotes");
    const col = db.collection("products");
    const products = await col.find({}).toArray();
    products.forEach((p, i) => {
      console.log(JSON.stringify({ index: i, sku: p.sku, name: p.name }));
    });
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
