import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { ProxyAgent, fetch as undiciFetch } from "undici";

const APP_KEY = process.env.TEMU_APP_KEY!;
const APP_SECRET = process.env.TEMU_APP_SECRET!;
const ACCESS_TOKEN = process.env.TEMU_ACCESS_TOKEN!;
const SITE = (process.env.TEMU_SITE || "global").toLowerCase();
const PROXY_URL = process.env.PROXY_URL || "";
const DRY_RUN = !process.argv.includes("--delete");

const ENDPOINTS: Record<string, string> = {
  us: "https://openapi-b-us.temu.com/openapi/router",
  global: "https://openapi-b-global.temu.com/openapi/router",
};

function sign(params: Record<string, unknown>, secret: string): string {
  const entries = Object.entries(params).map(([k, v]) => {
    const val = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
    return [k, val] as [string, string];
  });
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const joined = entries.map(([k, v]) => `${k}${v}`).join("");
  return crypto.createHash("md5").update(`${secret}${joined}${secret}`).digest("hex").toUpperCase();
}

const dispatcher = PROXY_URL ? new ProxyAgent({ uri: PROXY_URL }) : undefined;

async function call(type: string, businessParams: Record<string, unknown>) {
  const params: Record<string, unknown> = {
    type, app_key: APP_KEY, access_token: ACCESS_TOKEN,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    data_type: "JSON", ...businessParams,
  };
  const body = { ...params, sign: sign(params, APP_SECRET) };
  const res = await undiciFetch(ENDPOINTS[SITE], {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    ...(dispatcher ? { dispatcher } : {}),
  } as any);
  return { status: res.status, text: await res.text() };
}

async function main() {
  console.log(DRY_RUN ? "DRY RUN — listing only. Add --delete to actually delete.\n" : "DELETING ALL PRODUCTS\n");
  // Try all goodsSearchType values to find all products
  const allGoodsIds = new Set<string>();
  for (const searchType of [0, 1, 2, 3, 4, 5]) {
    let pageNo = 1;
    while (true) {
      const r = await call("bg.local.goods.list.query", { pageNo, pageSize: 50, goodsSearchType: searchType });
      const d = JSON.parse(r.text);
      if (!d.success) break;
      const list = d.result?.goodsList || [];
      if (list.length === 0) break;
      for (const g of list) allGoodsIds.add(String(g.goodsId));
      if (list.length < 50) break;
      pageNo++;
    }
  }
  console.log(`Found ${allGoodsIds.size} unique products\n`);
  let deleted = 0;
  for (const goodsId of allGoodsIds) {
    console.log(`  goodsId=${goodsId}`);
    if (!DRY_RUN) {
      const dr = await call("temu.local.goods.delete", { goodsId: Number(goodsId) });
      const dd = JSON.parse(dr.text);
      console.log(`    delete: ${dd.success ? "OK" : "FAIL " + dd.errorMsg}`);
      if (dd.success) deleted++;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  console.log(`\n${DRY_RUN ? "(dry run)" : `Deleted: ${deleted} of ${allGoodsIds.size}`}`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
