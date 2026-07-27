const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/";

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db("allremotes");
    const col = db.collection("products");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
