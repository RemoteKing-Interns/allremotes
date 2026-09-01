import { MongoClient } from "mongodb";
import { encrypt, emailHash, isEncrypted, PII_FIELDS } from "../src/lib/pii-crypto";

function getMongoUri() {
  return String(process.env.MONGODB_URI || "").trim();
}

function getMongoDbName() {
  const explicit = String(process.env.MONGODB_DB || "").trim();
  if (explicit) return explicit;
  const uri = getMongoUri();
  const withoutQuery = uri.split("?")[0] || "";
  const slashIndex = withoutQuery.lastIndexOf("/");
  const dbPart = withoutQuery.slice(slashIndex + 1).trim();
  if (!dbPart || dbPart.includes("@")) return "allremotes";
  return dbPart;
}

function getNested(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setNested(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  const last = keys.pop()!;
  keys.reduce((o, k) => ((o[k] ??= {}), o[k]), obj)[last] = value;
}

async function migrateCollection(
  db: any,
  collectionName: string,
  fields: readonly string[],
  emailField?: string,
  emailHashField?: string
) {
  const col = db.collection(collectionName);
  const docs = await col.find({}).toArray();
  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    let needsUpdate = false;
    const updateDoc: Record<string, any> = {};

    for (const field of fields) {
      const value = getNested(doc, field);
      if (typeof value === "string" && value && !isEncrypted(value)) {
        setNested(updateDoc, field, encrypt(value));
        needsUpdate = true;
      }
    }

    // Add emailHash if we have a plaintext email and the hash field is missing
    if (emailField && emailHashField) {
      const emailValue = getNested(doc, emailField);
      const existingHash = getNested(doc, emailHashField);
      // Use plaintext email if not yet encrypted, otherwise skip (can't hash encrypted value)
      if (emailValue && !isEncrypted(emailValue) && !existingHash) {
        setNested(updateDoc, emailHashField, emailHash(emailValue));
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      // Flatten nested fields for MongoDB $set
      const flatUpdate: Record<string, any> = {};
      for (const [k, v] of Object.entries(updateDoc)) {
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          for (const [k2, v2] of Object.entries(v)) {
            flatUpdate[`${k}.${k2}`] = v2;
          }
        } else {
          flatUpdate[k] = v;
        }
      }
      await col.updateOne({ _id: doc._id }, { $set: flatUpdate });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`  ${collectionName}: ${updated} encrypted, ${skipped} skipped`);
  return updated;
}

async function main() {
  const uri = getMongoUri();
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    ...(String(process.env.MONGODB_TLS_INSECURE || "").trim() === "1"
      ? { tls: true, tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true }
      : null),
  });

  await client.connect();
  const db = client.db(getMongoDbName());
  console.log(`Connected to database: ${db.databaseName}\n`);

  console.log("Encrypting existing PII data...\n");

  // Users
  await migrateCollection(db, "users", PII_FIELDS.user, "email", "emailHash");

  // Admin users
  await migrateCollection(db, "admin_users", PII_FIELDS.user, "email", "emailHash");

  // Orders (includes invoices stored as type: "invoice")
  await migrateCollection(db, "orders", PII_FIELDS.order, "customer.email", "customer.emailHash");

  // Channel orders
  await migrateCollection(db, "channelOrders", PII_FIELDS.order, "customer.email", "customer.emailHash");

  // Returns - customerEmail and customerName are top-level fields
  await migrateCollection(db, "returns", ["customerEmail", "customerName"], "customerEmail", "customerEmailHash");

  // Contact messages
  await migrateCollection(db, "contact_messages", PII_FIELDS.contact, "email", "emailHash");

  // Customers collection (admin-created customers)
  await migrateCollection(db, "customers", PII_FIELDS.customer, "email", "emailHash");

  // Support threads
  await migrateCollection(db, "support_threads", ["customerEmail", "customerName"], "customerEmail", "customerEmailHash");

  // Support messages
  await migrateCollection(db, "support_messages", ["customerEmail"]);

  // Carts
  await migrateCollection(db, "carts", ["email"], "email", "emailHash");

  // Admin invites
  await migrateCollection(db, "admin_invites", ["email", "name"], "email", "emailHash");

  // Coupons
  await migrateCollection(db, "coupons", ["customerEmail"], "customerEmail", "customerEmailHash");

  console.log("\nDone! All existing PII data has been encrypted.");
  await client.close();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
