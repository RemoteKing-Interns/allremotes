#!/usr/bin/env tsx
/**
 * Set TEMU SKU supplier price = catalog price for not-active products.
 * Reads temu-scan.json (from a detail scan) — regenerates it if missing.
 * Usage: npx tsx scripts/temu-sync-price.ts [--dry] [--status 302]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import fs from "fs";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { MongoClient } from "mongodb";

const APP_KEY=process.env.TEMU_APP_KEY!,APP_SECRET=process.env.TEMU_APP_SECRET!,ACCESS_TOKEN=process.env.TEMU_ACCESS_TOKEN!;
const PROXY_URL=process.env.PROXY_URL||"";
const EP="https://openapi-b-global.temu.com/openapi/router";
const DRY=process.argv.includes("--dry");
const STATUS_ARG=process.argv.find(a=>a.startsWith("--status="));
const ONLY_STATUS=STATUS_ARG?STATUS_ARG.split("=")[1].split(",").map(Number):null;

function sign(p:Record<string,unknown>,s:string){const e=Object.entries(p).map(([k,v])=>[k,typeof v==="object"&&v!==null?JSON.stringify(v):String(v)] as [string,string]);e.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);return crypto.createHash("md5").update(s+e.map(([k,v])=>k+v).join("")+s).digest("hex").toUpperCase();}
const disp=PROXY_URL?new ProxyAgent({uri:PROXY_URL}):undefined;
async function call(type:string,bp:Record<string,unknown>){const p={type,app_key:APP_KEY,access_token:ACCESS_TOKEN,timestamp:Math.floor(Date.now()/1000).toString(),data_type:"JSON",...bp};const res=await undiciFetch(EP,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...p,sign:sign(p,APP_SECRET)}),...(disp?{dispatcher:disp}:{})} as any);return res.json();}

async function main(){
  const scan:any[]=JSON.parse(fs.readFileSync("temu-scan.json","utf8"));
  const mc=new MongoClient(process.env.MONGODB_URI!);await mc.connect();
  const db=mc.db(process.env.MONGODB_DB);
  const prods=await db.collection("products").find({}).project({sku:1,price:1}).toArray();
  const pmap=Object.fromEntries(prods.map((p:any)=>[p.sku,p.price]));

  // not-active = detail query succeeded and subStatus != 303 (on sale)
  let targets=scan.filter((o:any)=>!o.error&&o.subStatus!==303&&o.skuId&&pmap[o.sku]!=null);
  if(ONLY_STATUS)targets=targets.filter((o:any)=>ONLY_STATUS.includes(o.subStatus));
  console.log(`targets: ${targets.length} not-active products${DRY?" (DRY)":""}`);

  let ok=0,fail=0;
  for(const t of targets){
    const price=Number(pmap[t.sku]);
    if(DRY){console.log(`${t.sku} subStatus=${t.subStatus} temu=${t.retail} -> ${price.toFixed(2)}`);continue;}
    try{
      const r:any=await call("bg.local.goods.priceorder.change.sku.price",{
        goodsId:Number(t.goodsId),
        changeSkuPriceDTOList:[{reason:"Sync to catalog price",skuChangePriceBaseDTOList:[{skuId:Number(t.skuId),newSupplierPrice:{amount:price.toFixed(2),currency:"AUD"}}]}],
        rejectSkuPricing:true,
      });
      if(r?.success){
        const failed=(r.result?.failedSkuList||[]).length;
        const reasonMap=r.result?.failedSkuReasonMap||{};
        if(failed>0){fail++;console.log(`FAIL ${t.sku}: ${JSON.stringify(reasonMap).slice(0,160)}`);}
        else{ok++;console.log(`OK   ${t.sku} -> ${price.toFixed(2)}`);}
      }else{fail++;console.log(`FAIL ${t.sku}: ${r?.errorCode} ${r?.errorMsg}`);}
    }catch(e:any){fail++;console.log(`FAIL ${t.sku}: ${e.message}`);}
    await new Promise(r=>setTimeout(r,500));
  }
  console.log(`\nDONE ok=${ok} fail=${fail}`);
  await mc.close();
}
main().catch(e=>{console.error(e);process.exit(1);});
