import { config } from "dotenv"; config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import fs from "fs";

// market-researched price = lowest genuine AU listing - ~$0.5-1.5
const MAP: Record<string,{mpn:string; title:string; price:number}> = {
  "AR-RCMP7":  {mpn:"E960M",  title:"Merlin E960M 4 Button Genuine Garage Door Remote",        price:56.95},  // mkt: Kogan/RP $58, Amazon $70
  "AR-RCMP11": {mpn:"E970M",  title:"Merlin E970M 4 Button Genuine Garage Door Remote",        price:54.45},  // mkt: eBay $50-55, Kogan $58
  "AR-RCMPCV1":{mpn:"E964M",  title:"Merlin E964M 4 Button Sun Visor Genuine Remote",          price:54.45},  // mkt: $55-65
  "AR-RCMP12": {mpn:"E980M",  title:"Merlin E980M Water Resistant 4 Button Genuine Remote",    price:74.45},  // mkt: Amazon $85, AO $75
  "AR-RCMPWM": {mpn:"E148M",  title:"Merlin E148M 4 Button Wireless Wall Mount Genuine Remote",price:64.45},  // mkt: Amazon $70, AO $65
  "AR-RCM25WP":{mpn:"E840M",  title:"Merlin E840M Wireless Keypad Garage Remote",              price:78.45},  // mkt: AO $80
  "AR-E8003R": {mpn:"E8003",  title:"Merlin E8003 3 Channel Receiver (50 Users)",              price:213.95}, // rare part
  "AR-RCM48":  {mpn:"M842RS", title:"Merlin M842RS 2 Button Genuine Garage Remote",            price:44.45},  // mkt: Kogan $44.95, AR $49+
  "AR-RCM13":  {mpn:"M802",   title:"Merlin M802 2 Button Genuine Garage Remote (Legacy)",     price:54.45},  // mkt: Amazon $55
  "AR-MYQ-G":  {mpn:"MYQ-G",  title:"Merlin myQ Gateway Smart Garage Control",                 price:74.95},  // keeps margin
  "AR-MYQ-B":  {mpn:"MYQ-B",  title:"Merlin myQ Connectivity Bundle",                          price:138.95}, // mkt: kit $155-185
  "AR-MYQ-L":  {mpn:"MYQ-L",  title:"Merlin myQ Remote LED Light (1500 lumens)",               price:173.95},
};

async function imgOK(url: string): Promise<boolean> {
  try {
    const r = await fetch(url);
    if (!r.ok) return false;
    const b = Buffer.from(await r.arrayBuffer());
    if (b[0] === 0x89) return b.readUInt32BE(16) >= 500 && b.readUInt32BE(20) >= 500; // PNG
    if (b[0] === 0xff && b[1] === 0xd8) { // JPEG: scan for SOF
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
          return b.readUInt16BE(i + 7) >= 500 && b.readUInt16BE(i + 5) >= 500;
        i += 2 + b.readUInt16BE(i + 2);
      }
      return false;
    }
    return true; // other formats - let it through
  } catch { return false; }
}
const strip = (h="") => h.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!); await c.connect();
  const db = c.db("allremotes");
  const tpl = "C:/Users/Ajay/Downloads/MyDeal_Product_Template.csv";
  const header = fs.readFileSync(tpl, "utf8").split("\n")[0].trim();
  const cols = header.split(",");
  const rows: string[] = [header];
  const esc = (v:any) => { const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; };

  for (const [sku, m] of Object.entries(MAP)) {
    const p: any = await db.collection("products").findOne({sku});
    if (!p) { console.log("MISS", sku); continue; }
    const okImgs: string[] = [];
    for (const u of (p.images||[])) { if (await imgOK(u)) okImgs.push(u); }
    console.log("   imgs ok:", okImgs.length, "of", (p.images||[]).length);
    const row = cols.map(col => {
      switch (col) {
        case "ParentSKU": return esc(sku);
        case "SKU": return esc(sku);
        case "DealTitle": return esc(m.title);
        case "Price": return esc(m.price.toFixed(2));
        case "RRP": return esc((m.price*1.15).toFixed(2));
        case "Stock": return esc(p.stock ?? 0);
        case "UnlimitedStock": return "N";
        case "MPN": return esc(m.mpn);
        case "Brand": return "Merlin";
        case "Condition": return "New";
        case "CategoryID": return "3465";
        case "Description": return esc(strip(p.description).slice(0,500));
        case "Specification": return esc("Frequency: 434.54 MHz rolling code (Security+ / Security+ 2.0). Batteries & programming instructions included.");
        case "SearchKeywords": return esc(`merlin,${m.mpn},garage remote,gate remote,replacement remote`);
        case "ShippingWeight": return "0.1";
        case "ShippingCostCategory": return "FreeShipping";
        case "FastDispatch": return "Y";
        case "IsGstExempt": return "N";
        default:
          const m2 = col.match(/^ImageURL_(\d+)$/);
          if (m2) { const i = Number(m2[1])-1; return esc(okImgs[i] || ""); }

      }
    }).join(",");
    rows.push(row);
    console.log(`${sku} ${m.mpn} -> $${m.price}`);
  }
  const out = "C:/Users/Ajay/Downloads/MyDeal_Product_Template_FILLED.csv";
  fs.writeFileSync(out, rows.join("\n"), "utf8");
  console.log("WROTE", out, rows.length-1, "products");
  await c.close(); process.exit(0);
})();
