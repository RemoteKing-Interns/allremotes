#!/usr/bin/env tsx
/**
 * Push active products without a TEMU listing to TEMU.
 *
 * Category + attribute profile per product type:
 *   garage remotes            -> TEMU_DEFAULT_CATID (14416), battery profile (defaults)
 *   automotive key-covers     -> 22141 Key Shells, passive profile (no electricity)
 *   automotive transponders   -> 22067 Remote Control Transmitters, passive profile
 *
 * Passive profile matches what TEMU actually approved for passive goods:
 * Power Supply "Use Without Electricity" (36627), Battery "Without Battery" (52032),
 * and drops the remote-only "Code Way"/"Country Area" attributes.
 *
 * Usage:
 *   npx tsx scripts/temu-push.ts --dry            # preview what would be pushed
 *   npx tsx scripts/temu-push.ts --sku AR-X       # push one product
 *   npx tsx scripts/temu-push.ts --only keycovers # push one group
 *   npx tsx scripts/temu-push.ts                  # push everything missing
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import type { ListingPayload } from "../src/lib/channels/core";

const DRY = process.argv.includes("--dry");
const SKU_ARG = process.argv.indexOf("--sku");
const ONLY_ARG = process.argv.indexOf("--only");
const SKU = SKU_ARG > -1 ? process.argv[SKU_ARG + 1] : undefined;
const ONLY = ONLY_ARG > -1 ? process.argv[ONLY_ARG + 1] : undefined;

const CATID_REMOTE = process.env.TEMU_DEFAULT_CATID || "14416";
const CATID_KEY_COVER = "22141"; // Automotive > Interior Accessories > Key Shells
const CATID_TRANSPONDER = "22067"; // Automotive > Anti-Theft > Keyless Entry > Remote Control Transmitters

// Passive goods: no power source at all. Removes remote-only attributes via
// empty-array overrides (supported by temu.ts aspect merge).
const PASSIVE_ASPECTS: Record<string, string[]> = {
  "1561": ["36627"], // Power Supply: Use Without Electricity
  "2153": ["52032"], // Battery Properties: Without Battery
  "2204": [],        // remove Code Way (remote-only)
  "2205": [],        // remove Adapt To The Country Area (remote-only)
};

type Group = "remote" | "keycovers" | "transponder";

function classify(p: any): { group: Group; catId: string; aspects?: ListingPayload["aspects"] } {
  if (p.cat2 === "key-covers") return { group: "keycovers", catId: CATID_KEY_COVER, aspects: PASSIVE_ASPECTS };
  if (p.category === "automotive" || p.cat1 === "automotive") return { group: "transponder", catId: CATID_TRANSPONDER, aspects: PASSIVE_ASPECTS };
  return { group: "remote", catId: CATID_REMOTE };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");

  const listings = await db.collection("channelListings").find({ channel: "temu" }).toArray();
  const listedSkus = new Set(listings.map((l) => l.sku));

  const filter: any = { status: { $ne: "draft" } };
  if (SKU) filter.sku = SKU;
  const products = await db.collection("products").find(filter).toArray();

  const groups: Record<Group, any[]> = { remote: [], keycovers: [], transponder: [] };
  const seenSkus = new Set<string>();
  for (const p of products) {
    if (!p.sku) continue;
    if (listedSkus.has(p.sku)) continue;
    if (seenSkus.has(p.sku)) { console.log(`SKIP duplicate sku ${p.sku} (${p.id})`); continue; }
    seenSkus.add(p.sku);
    groups[classify(p).group].push(p);
  }
  const queue = ONLY ? groups[ONLY as Group] || [] : [...groups.remote, ...groups.transponder, ...groups.keycovers];
  console.log(`to push: ${queue.length} (remote:${groups.remote.length} transponder:${groups.transponder.length} keycovers:${groups.keycovers.length})`);
  if (DRY) { queue.forEach((p) => console.log(" ", p.sku, "|", classify(p).group, classify(p).catId, "|", (p.name || "").slice(0, 55))); await c.close(); return; }

  // Dynamic imports AFTER dotenv — temu.ts/db.ts read env at module load.
  const { temuAdapter } = await import("../src/lib/channels/temu");
  const { buildListingPayload } = await import("../src/lib/channels/payload");
  const { saveChannelListing } = await import("../src/lib/channels/db");
  const creds = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID, expiresAt: "" };

  let ok = 0, fail = 0;
  for (const p of queue) {
    const { group, catId, aspects } = classify(p);
    try {
      // Persist the chosen catId so future updates and admin UI keep it.
      await db.collection("products").updateOne({ _id: p._id }, { $set: { "marketplaceCategory.temu": catId } });
      p.marketplaceCategory = { ...p.marketplaceCategory, temu: catId };

      const payload = await buildListingPayload(p, "temu");
      payload.aspects = aspects;
      const r = await temuAdapter.publishListing(payload, creds);
      await saveChannelListing({
        productId: p.id, sku: payload.sku, channel: "temu",
        externalId: r.externalId, externalUrl: r.externalUrl,
        status: "listed", lastSyncedAt: new Date().toISOString(),
      });
      ok++;
      console.log(`OK   ${p.sku} [${group}] -> ${r.externalId}`);
    } catch (e: any) {
      fail++;
      console.log(`FAIL ${p.sku} [${group}]: ${String(e?.message || e).slice(0, 160)}`);
    }
    await sleep(1200); // ~1 req/sec sustained, image uploads included
  }
  console.log(`\ndone. ok=${ok} fail=${fail}`);
  await c.close();
})();
