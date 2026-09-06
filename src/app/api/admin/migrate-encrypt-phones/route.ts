import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { encrypt, isEncrypted } from "@/lib/pii-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One-time migration: encrypt plaintext phone numbers in users collection
export async function POST() {
  if (!mongoEnabled()) {
    return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });
  }
  try {
    const db = await getDb();
    const col = db.collection("users");

    const users = await col.find({ phone: { $exists: true, $ne: "" } }).toArray();
    let migrated = 0;
    let skipped = 0;
    const bulkOps: any[] = [];

    for (const u of users) {
      const phone = u.phone;
      if (typeof phone !== "string" || !phone) { skipped++; continue; }
      if (isEncrypted(phone)) { skipped++; continue; }
      bulkOps.push({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { phone: encrypt(phone) } },
        },
      });
      migrated++;
    }

    let result = null;
    if (bulkOps.length > 0) {
      result = await col.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      success: true,
      scanned: users.length,
      migrated,
      skipped,
      bulkResult: result ? { modifiedCount: result.modifiedCount } : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Migration failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
