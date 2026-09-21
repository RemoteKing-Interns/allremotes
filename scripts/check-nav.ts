import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const doc = await db.collection("content").findOne({ _id: "navigation" });
  if (!doc) { console.log("NO navigation doc in DB — file default is live"); await client.close(); return; }
  const data = doc.data;
  console.log("type:", Array.isArray(data) ? "array" : typeof data);
  if (Array.isArray(data)) {
    console.log("sections:", data.map((s: any) => `${s.id} (visible=${s.visible !== false})`).join(", "));
    const auto = data.find((s: any) => s.id === "automotive");
    console.log("automotive section:", JSON.stringify(auto || null));
  }
  await client.close();
}
main().catch(e => { console.error(e.message); process.exit(1); });
