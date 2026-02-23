import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { readProductsJson } from "@/lib/products-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mongoTroubleshootingHint(err: unknown) {
  const msg = String((err as any)?.message || err || "");
  if (
    msg.includes("tlsv1 alert internal error") ||
    msg.includes("SSL alert number 80") ||
    msg.includes("ssl3_read_bytes")
  ) {
    return "MongoDB TLS handshake failed. If you use MongoDB Atlas, check: Atlas → Network Access → allow this environment (quick test: add 0.0.0.0/0), then redeploy. Also ensure your MONGODB_URI uses mongodb+srv:// and your password is URL-encoded if it has special characters.";
  }
  if (msg.includes("IP") && msg.toLowerCase().includes("not allowed")) {
    return "MongoDB Atlas blocked this connection (IP not allowlisted). Atlas → Network Access → add the required IP range (quick test: 0.0.0.0/0), then redeploy.";
  }
  if (msg.includes("Authentication failed") || msg.toLowerCase().includes("bad auth")) {
    return "MongoDB authentication failed. Re-check the DB username/password in MONGODB_URI (URL-encode special characters) and ensure the user has access to the target database.";
  }
  if (msg.includes("ENOTFOUND")) {
    return "MongoDB hostname could not be resolved. Re-check the MONGODB_URI hostname and ensure DNS is working in your deployment environment.";
  }
  return null;
}

export async function GET() {
  try {
    let products: any[];
    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("products");
      await col.createIndex({ id: 1 }, { unique: true });
      await col.createIndex({ skuKey: 1 }, { unique: true, sparse: true });
      products = await col.find({}).project({ _id: 0 }).toArray();
    } else {
      products = await readProductsJson();
    }

    return NextResponse.json(products, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    const hint = mongoTroubleshootingHint(err);
    return NextResponse.json(
      {
        error: "Failed to load products",
        details: err?.message || String(err),
        ...(hint ? { hint } : null),
      },
      { status: 500 }
    );
  }
}
