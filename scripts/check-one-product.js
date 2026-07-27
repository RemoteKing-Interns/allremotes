const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/";

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db("allremotes");
    const col = db.collection("products");
    const product = await col.findOne({ sku: "AR-RMDB01E" });
    if (!product) {
      console.log("Product not found");
      return;
    }
    const fields = ["description", "features", "specification", "compatibility", "instructions"];
    fields.forEach((f) => {
      const val = product[f];
      console.log(`=== ${f} ===`);
      if (val) {
        console.log(`Length: ${String(val).length}`);
        console.log(String(val));
      } else {
        console.log("NULL");
      }
      console.log("");
    });
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
