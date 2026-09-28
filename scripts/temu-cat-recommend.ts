import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { ProxyAgent, fetch as undiciFetch } from "undici";

const APP_KEY = process.env.TEMU_APP_KEY!;
const APP_SECRET = process.env.TEMU_APP_SECRET!;
const ACCESS_TOKEN = process.env.TEMU_ACCESS_TOKEN!;
const ENDPOINT = "https://openapi-b-global.temu.com/openapi/router";
const PROXY_URL = process.env.PROXY_URL || "";

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

async function getCats(parentCatId: number) {
  const params = { type: "bg.local.goods.cats.get", app_key: APP_KEY, access_token: ACCESS_TOKEN, timestamp: Math.floor(Date.now()/1000).toString(), data_type: "JSON", parentCatId };
  const res = await undiciFetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...params, sign: sign(params, APP_SECRET) }), ...(dispatcher ? { dispatcher } : {}) } as any);
  const data = await res.json() as any;
  if (!data.success) throw new Error(`${data.errorCode} ${data.errorMsg}`);
  return (data.result as any)?.goodsCatsList || [];
}

// args: catId to list children of
(async () => {
  const id = Number(process.argv[2] || 0);
  const cats = await getCats(id);
  cats.forEach((c: any) => console.log(`${c.catId}\t${c.leaf ? "LEAF" : "    "}\t${c.catName}`));
})();
