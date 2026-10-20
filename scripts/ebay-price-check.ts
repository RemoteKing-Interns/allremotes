import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const SKU_ARG = process.argv.indexOf("--sku");
const ONLY = SKU_ARG > -1 ? process.argv[SKU_ARG + 1] : undefined;
const H = (tok: string) => ({ Authorization: `Bearer ${tok}`, "Content-Type": "application/json", "Accept-Language": "en-AU", "X-EBAY-C-MARKETPLACE-ID": "EBAY_AU" });
const api = async (url: string, tok: string) => (await fetch(url, { headers: H(tok), signal: AbortSignal.timeout(15000) })).json();

(async () => {
  const { getValidCredentials } = await import("../src/lib/channels/db");
  const creds = await getValidCredentials("ebay");
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db(process.env.MONGODB_DB || undefined);
  const prods = await db.collection("products").find({ category: "batteries" }).project({ sku: 1, price: 1 }).toArray();
  const pmap = new Map(prods.map((p: any) => [p.sku, Number(p.price)]));
  const ls = await db.collection("channelListings").find({ channel: "ebay", status: { $ne: "delisted" } }).toArray();
  const bat = ls.filter((l: any) => pmap.has(String(l.sku).replace(/X\d+$/, "")));
  console.log(`${bat.length} live eBay battery listings`);
  await c.close();

  let mismatch = 0, checked = 0;
  for (const l of bat) {
    const sku = String(l.sku);
    if (ONLY && sku !== ONLY) continue;
    const m = sku.match(/^(.*)X(\d+)$/);
    const n = m ? +m[2] : 1;
    const expect = Math.round((pmap.get(m ? m[1] : sku) || 0) * n * 100) / 100;
    const d = await api(`https://api.ebay.com/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}`, creds.accessToken);
    if (!d.offers?.length) { console.log(`${sku}: RAW ${JSON.stringify(d).slice(0, 200)}`); continue; }
    for (const o of d.offers) {
      checked++;
      const live = Number(o.pricingSummary?.price?.value || 0);
      if (Math.abs(live - expect) > 0.005) { mismatch++; console.log(`${sku}: live $${live.toFixed(2)} expect $${expect.toFixed(2)} (x${n})  <-- MISMATCH`); }
      else if (ONLY) console.log(`${sku}: live $${live.toFixed(2)} = expected $${expect.toFixed(2)} qty ${o.availableQuantity} status ${o.status}`);
    }
  }
  console.log(`\nchecked=${checked} mismatches=${mismatch}`);
  process.exit(0);
})();
