#!/usr/bin/env tsx
/**
 * Search the TEMU category tree for leaf categories matching a keyword.
 * Usage: npx tsx scripts/temu-cats.ts [keyword]
 * Prunes top-level branches that can't contain remotes/parts to keep it fast.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { ProxyAgent, fetch as undiciFetch } from "undici";

const APP_KEY = process.env.TEMU_APP_KEY!;
const APP_SECRET = process.env.TEMU_APP_SECRET!;
const ACCESS_TOKEN = process.env.TEMU_ACCESS_TOKEN!;
const SITE = (process.env.TEMU_SITE || "global").toLowerCase();
const PROXY_URL = process.env.PROXY_URL || "";
const KEYWORD = (process.argv[2] || "remote").toLowerCase();

const ENDPOINTS: Record<string, string> = {
  us: "https://openapi-b-us.temu.com/openapi/router",
  eu: "https://openapi-b-eu.temu.com/openapi/router",
  global: "https://openapi-b-global.temu.com/openapi/router",
};

// Only descend into top-level branches that could plausibly hold our products
const KEEP_TOP = /electron|appliance|automotive|vehicle|tool|home improvement|hardware|office|security/i;

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

async function getCats(parentCatId: number): Promise<any[]> {
  const params: Record<string, unknown> = {
    type: "bg.local.goods.cats.get",
    app_key: APP_KEY,
    access_token: ACCESS_TOKEN,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    data_type: "JSON",
    parentCatId,
  };
  const body = { ...params, sign: sign(params, APP_SECRET) };
  const res = await undiciFetch(ENDPOINTS[SITE], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    ...(dispatcher ? { dispatcher } : {}),
  } as any);
  const data = await res.json();
  if (!data.success) throw new Error(`cats.get failed: ${data.errorCode} ${data.errorMsg}`);
  return (data.result as any)?.goodsCatsList || [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function walk(parentCatId: number, path: string, depth: number) {
  if (depth > 5) return;
  const cats = await getCats(parentCatId);
  for (const c of cats) {
    const p = path ? `${path} > ${c.catName}` : c.catName;
    if (depth === 0 && !KEEP_TOP.test(c.catName)) continue; // prune top level
    if (c.leaf) {
      if (p.toLowerCase().includes(KEYWORD)) console.log(`${c.catId}\t${p}`);
    } else {
      await sleep(1500); // TEMU rate limit: ~1 req/sec sustained
      await walk(c.catId, p, depth + 1);
    }
  }
}

walk(0, "", 0).catch((e) => { console.error(e.message); process.exit(1); });
