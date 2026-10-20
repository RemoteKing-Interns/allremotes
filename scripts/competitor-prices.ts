// Reprice products to competitor (Remote Pro) - $0.15.
// Matches our products to remotepro.com.au listings via brand + model tokens
// from rp-catalog.json (refresh with `node scripts/rp-catalog.mjs`).
// Dry-run by default; --apply writes prices to MongoDB.
//   npx tsx scripts/competitor-prices.ts           → report only
//   npx tsx scripts/competitor-prices.ts --apply   → update MongoDB
//   npx tsx scripts/competitor-prices.ts --sku AR-RC01
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "fs";

const UNDERCUT = 0.15;
const STOP = new Set(["REMOTE", "CONTROL", "GARAGE", "DOOR", "GATE", "BUTTON", "BUTTONS", "MHZ", "GENUINE", "AFTERMARKET", "COMPATIBLE", "REPLACEMENT", "SUIT", "FOR", "THE", "AND", "WITH", "KEY", "FOB", "NEW", "CODE", "ROLLING", "FIXED", "ORIGINAL"]);

function tokens(s: string) {
  return (s || "").toUpperCase().split(/[^A-Z0-9]+/).filter((t) => t.length >= 2 && !STOP.has(t));
}
// model codes: letter+digit mix, normalized (XT02→XT2), excluding freq/unit/count tokens
const NOT_MODEL = /^\d+(MHZ|KHZ|MM|CM|M|W|V|A|MAH|BUTTON|CHANNEL|CH|PACK|PCS|YEAR|WAY)$/;
function normModel(t: string) {
  return t.replace(/(\D)0+(\d)/g, "$1$2");
}
function modelTokens(s: string) {
  return tokens(s)
    .filter((t) => /[A-Z]/.test(t) && /\d/.test(t) && !NOT_MODEL.test(t))
    .map(normModel);
}
function buttons(s: string) {
  const m = (s || "").match(/(\d)\s*BUTTON/i);
  return m ? m[1] : null;
}
const isGenuine = (s: string) => /genuine|original|oem/i.test(s || "");

type RpItem = { title: string; handle: string; vendor: string; price: number; avail: boolean; tokSet: Set<string>; modSet: Set<string> };

const catalog: RpItem[] = JSON.parse(readFileSync("rp-catalog.json", "utf8"))
  .map((p: any) => {
    const avail = (p.variants || []).filter((v: any) => v.avail && v.price > 0 && !/PACKET/i.test(v.sku || ""));
    const price = avail.length ? Math.min(...avail.map((v: any) => v.price)) : null;
    const text = `${p.title} ${p.handle}`;
    return {
      title: p.title, handle: p.handle, vendor: p.vendor || "",
      price, avail: !!avail.length,
      tokSet: new Set(tokens(text)), modSet: new Set(modelTokens(text)),
    };
  })
  .filter((p: any) => p.price != null);

// index catalog by all tokens + normalized model tokens for fast lookup
const byToken = new Map<string, RpItem[]>();
for (const item of catalog) for (const t of new Set([...item.tokSet, ...item.modSet])) {
  if (t.length >= 3 || item.modSet.has(t)) (byToken.get(t) || byToken.set(t, []).get(t)!).push(item);
}

// product-type words — a remote must not match a receiver/motor/etc
const TYPE_WORDS = ["RECEIVER", "MOTOR", "CONTROLLER", "BOARD", "ANTENNA", "KEYPAD", "PHOTOCELL", "BEAM", "CHARGER", "ADAPTER", "EMULATOR", "BATTERY", "DISPLAY", "STAND", "SEAL", "LOCK", "WIRE", "CABLE", "COVER", "CASE", "SYSTEM", "BUNDLE", "KIT", "SHELL", "CASING", "CHIP", "HARNESS", "MODULE", "UPGRADE", "DEADBOLT", "DOORLOCK", "HOUSING", "FLIP"];

function squish(s: string) {
  return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function match(brand: string, name: string, genuineWanted: boolean) {
  const text = `${brand} ${name}`;
  // model codes come from the product name minus brand tokens — "4D" in "4D Doors" mustn't count
  const brandSet = new Set(tokens(brand));
  const oursRaw = tokens(name).filter((t) => !brandSet.has(t) && /[A-Z]/.test(t) && /\d/.test(t) && !NOT_MODEL.test(t));
  const ours = oursRaw.map(normModel);
  const oursAll = new Set(tokens(text));
  const brandTok = tokens(brand)[0];
  const ourBtns = buttons(text);
  const letterWords = [...new Set(tokens(text).filter((t) => !/\d/.test(t) && t.length >= 2))];
  const ourSquish = squish(letterWords.join(""));
  const candidates = new Map<RpItem, number>();

  for (const mt of new Set([...oursRaw, ...ours])) for (const item of byToken.get(mt) || []) {
    candidates.set(item, (candidates.get(item) || 0) + 2); // shared model token = strong signal
  }
  for (const t of oursAll) if (t.length >= 4) for (const item of byToken.get(t) || []) {
    candidates.set(item, candidates.get(item) || 0);
  }
  if (!candidates.size) return null;

  let best: RpItem | null = null;
  let bestScore = 0;
  for (const [item, score] of candidates) {
    const brandOk = !!(brandTok && (item.vendor.toUpperCase().includes(brandTok) || item.tokSet.has(brandTok)));
    const sharedModels = [...item.modSet].filter((t) => ours.includes(t)).length;
    // shared descriptive words — brand tokens don't count (they'd make any same-brand item match)
    const sharedLetters = [...item.tokSet].filter((t) => t.length >= 3 && oursAll.has(t) && !/\d/.test(t) && !brandSet.has(t)).length;
    const subMatch = letterWords.length >= 3 && ourSquish.length >= 6 && squish(item.title).includes(ourSquish);
    if (!(sharedModels >= 1 && (brandOk || sharedModels >= 2)) && !(brandOk && (sharedLetters >= 2 || subMatch))) continue;
    // type conflict: remote vs receiver/motor/etc
    if (TYPE_WORDS.some((w) => item.tokSet.has(w) && !oursAll.has(w))) continue;
    const theirBtns = buttons(item.title);
    if (ourBtns && theirBtns && ourBtns !== theirBtns) continue;
    let s = score + (brandOk ? 3 : 0) + sharedLetters * 0.5 + (subMatch ? 2 : 0);
    if (isGenuine(item.title) === genuineWanted) s += 1;
    if (ourBtns && theirBtns) s += 1;
    if (s > bestScore) { bestScore = s; best = item; }
  }
  return best;
}

(async () => {
  const apply = process.argv.includes("--apply");
  const skuArg = process.argv.find((a) => a.startsWith("--sku="))?.split("=")[1]
    || (process.argv.includes("--sku") ? process.argv[process.argv.indexOf("--sku") + 1] : undefined);

  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || undefined);
  const col = db.collection("products");

  const filter: any = skuArg ? { sku: skuArg } : { price: { $gt: 0 } };
  const products = await col.find(filter).project({ sku: 1, name: 1, brand: 1, price: 1, comparePrice: 1, tags: 1 }).toArray();
  console.log(`${products.length} products vs ${catalog.length} competitor listings${apply ? " — APPLYING" : " — dry run"}\n`);

  const stats = { raise: 0, drop: 0, keep: 0, floorBlock: 0, noMatch: 0, unavail: 0 };
  const updates: { sku: string; price: number }[] = [];

  for (const p of products) {
    const ours = Number(p.price || 0);
    const floor = Number(p.comparePrice || 0) > 0 ? Number(p.comparePrice) : null;
    const genuine = isGenuine(`${p.tags} ${p.name}`);
    const tag = genuine ? " [Genuine]" : "";
    const m = match(p.brand || "", p.name || "", genuine);

    if (!m) { stats.noMatch++; console.log(`—    ${p.sku}: ${p.name?.slice(0, 45)} — no RP match`); continue; }
    if (!m.avail) { stats.unavail++; console.log(`—    ${p.sku}: RP out of stock (${m.title.slice(0, 70)}), keep $${ours.toFixed(2)}`); continue; }

    const target = Math.round((m.price - UNDERCUT) * 100) / 100;
    if (floor && target < floor) {
      stats.floorBlock++;
      console.log(`FLOOR${tag} ${p.sku}: comp $${m.price.toFixed(2)} → target $${target.toFixed(2)} below floor $${floor.toFixed(2)} — keep $${ours.toFixed(2)}`);
      continue;
    }
    const diff = Math.round((target - ours) * 100) / 100;
    if (Math.abs(diff) < 0.005) { stats.keep++; console.log(`=    ${p.sku}: $${ours.toFixed(2)} ok | ${m.title.slice(0, 70)}`); continue; }
    if (diff > 0) stats.raise++; else stats.drop++;
    console.log(`${diff > 0 ? "UP  " : "DOWN"}${tag} ${p.sku}: $${ours.toFixed(2)} → $${target.toFixed(2)} | RP $${m.price.toFixed(2)} "${m.title.slice(0, 70)}"`);
    updates.push({ sku: p.sku, price: target });
  }

  console.log(`\n${updates.length} changes (${stats.raise} raises, ${stats.drop} drops) | ok: ${stats.keep} | floor-blocked: ${stats.floorBlock} | no match: ${stats.noMatch} | RP OOS: ${stats.unavail}`);

  if (apply && updates.length) {
    const now = new Date();
    const res = await col.bulkWrite(updates.map((u) => ({
      updateOne: { filter: { sku: u.sku }, update: { $set: { price: u.price, lastUpdated: now, lastUpdatedBy: "competitor-prices" } } },
    })));
    console.log(`Applied: ${res.modifiedCount} products updated`);
  } else if (updates.length) {
    console.log("Dry run — re-run with --apply to write these prices");
  }
  await client.close();
  process.exit(0);
})();
