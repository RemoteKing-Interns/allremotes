/**
 * One-off migration: re-encrypt PII that was encrypted with the dev fallback key
 * (allremotes-dev-key) using the production PII_ENCRYPTION_KEY.
 *
 * Run with:
 *   PII_ENCRYPTION_KEY=<prod-key> MONGODB_URI=<uri> MONGODB_DB=allremotes \
 *   npx tsx scripts/reencrypt-pii-dev-to-prod.ts
 */
import crypto from "crypto";
import { MongoClient } from "mongodb";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:";
const DEV_KEY = crypto.scryptSync("allremotes-dev-key", "salt", 32);

function getProdKey(): Buffer {
  const hex = String(process.env.PII_ENCRYPTION_KEY || "").trim();
  if (!hex) throw new Error("PII_ENCRYPTION_KEY env var is required");
  return Buffer.from(hex, "hex");
}

function decryptWith(value: string, key: Buffer): string | null {
  if (!value || !value.startsWith(PREFIX)) return null;
  try {
    const parts = value.slice(PREFIX.length).split(":");
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], "base64");
    const data = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const d = crypto.createDecipheriv(ALGORITHM, key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function encryptWith(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([c.update(plaintext, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${enc.toString("base64")}:${tag.toString("base64")}`;
}

function getNested(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setNested(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  const last = keys.pop()!;
  keys.reduce((o, k) => ((o[k] ??= {}), o[k]), obj)[last] = value;
}

const FIELDS: Record<string, readonly string[]> = {
  users: ["name", "email"],
  admin_users: ["name", "email"],
  orders: [
    "customer.fullName", "customer.email", "customer.phone", "customer.username",
    "shipping.address", "shipping.address2", "shipping.city", "shipping.state",
    "shipping.zipCode", "shipping.phone", "shipping.country",
  ],
  channelOrders: [
    "customer.fullName", "customer.email", "customer.phone", "customer.username",
    "shipping.address", "shipping.address2", "shipping.city", "shipping.state",
    "shipping.zipCode", "shipping.phone", "shipping.country",
  ],
  returns: ["customerName", "customerEmail", "phone", "address", "address2", "city", "state", "zipCode"],
  contact_messages: ["name", "email", "phone", "message"],
  customers: ["name", "email", "phone", "address", "address2", "city", "state", "zipCode"],
  support_threads: ["customerEmail", "customerName"],
  support_messages: ["customerEmail"],
  carts: ["email"],
  admin_invites: ["email", "name"],
  coupons: ["customerEmail"],
};

async function migrateCollection(db: any, name: string, fields: readonly string[]) {
  const col = db.collection(name);
  const docs = await col.find({}).toArray();
  let reencrypted = 0;
  let skipped = 0;

  for (const doc of docs) {
    const flatUpdate: Record<string, any> = {};
    let needsUpdate = false;

    for (const field of fields) {
      const value = getNested(doc, field);
      if (typeof value !== "string" || !value.startsWith(PREFIX)) continue;

      // Try dev key first (legacy), then prod key (already migrated)
      const devPlain = decryptWith(value, DEV_KEY);
      if (devPlain === null) continue; // already prod-encrypted or undecryptable

      const prodKey = getProdKey();
      // Verify it's NOT already prod-encrypted
      const prodPlain = decryptWith(value, prodKey);
      if (prodPlain !== null) continue; // already prod-encrypted, skip

      const reencrypted = encryptWith(devPlain, prodKey);
      setNested(flatUpdate, field, reencrypted);
      needsUpdate = true;
    }

    if (needsUpdate) {
      // Flatten nested fields for MongoDB $set
      const flat: Record<string, any> = {};
      for (const [k, v] of Object.entries(flatUpdate)) {
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          for (const [k2, v2] of Object.entries(v)) {
            flat[`${k}.${k2}`] = v2;
          }
        } else {
          flat[k] = v;
        }
      }
      await col.updateOne({ _id: doc._id }, { $set: flat });
      reencrypted++;
    } else {
      skipped++;
    }
  }

  console.log(`  ${name}: ${reencrypted} re-encrypted, ${skipped} skipped`);
  return reencrypted;
}

async function main() {
  const uri = String(process.env.MONGODB_URI || "").trim();
  if (!uri) { console.error("MONGODB_URI is not set"); process.exit(1); }
  const dbName = String(process.env.MONGODB_DB || "").trim() || "allremotes";

  // Verify prod key is valid
  getProdKey();

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
  await client.connect();
  const db = client.db(dbName);
  console.log(`Connected to: ${db.databaseName}\n`);

  console.log("Re-encrypting dev-key PII to production key...\n");
  let total = 0;
  for (const [name, fields] of Object.entries(FIELDS)) {
    total += await migrateCollection(db, name, fields);
  }

  console.log(`\nDone! ${total} documents re-encrypted.`);
  await client.close();
}

main().catch((err) => { console.error("Migration failed:", err); process.exit(1); });
