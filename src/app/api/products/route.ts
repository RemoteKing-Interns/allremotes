import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { enrichProductsWithS3Images } from "@/lib/products-json";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
  if (
    msg.includes("Authentication failed") ||
    msg.toLowerCase().includes("bad auth")
  ) {
    return "MongoDB authentication failed. Re-check the DB username/password in MONGODB_URI (URL-encode special characters) and ensure the user has access to the target database.";
  }
  if (msg.includes("ENOTFOUND")) {
    return "MongoDB hostname could not be resolved. Re-check the MONGODB_URI hostname and ensure DNS is working in your deployment environment.";
  }
  return null;
}

export async function GET() {
  try {
    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const db = await getDb();
    const col = db.collection("products");
    let products: any[] = await col.find({}).toArray();

    // Enrich products with S3 image URLs based on SKU
    // Pattern: https://allremotes.s3.ap-southeast-2.amazonaws.com/images/{sku}-N.png
    products = enrichProductsWithS3Images(products);

    return NextResponse.json(products, {
      headers: { 
        "Cache-Control": "no-store",
        "X-Products-Source": "mongodb",
        "X-S3-Images-Enriched": "true",
        ...CORS_HEADERS 
      },
    });
  } catch (err: any) {
    const hint = mongoTroubleshootingHint(err);
    return NextResponse.json(
      {
        error: "Failed to load products",
        details: err?.message || String(err),
        ...(hint ? { hint } : null),
      },
      { 
        status: 500,
        headers: CORS_HEADERS 
      },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("products");
      const result = await col.deleteOne({ id });
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404, headers: CORS_HEADERS }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: "Product deleted successfully" },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete product", details: err?.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
