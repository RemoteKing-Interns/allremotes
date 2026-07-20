import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { readProductsJson, enrichProductWithS3Images } from "@/lib/products-json";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let mongoError: unknown = null;

  try {
    let product: any = null;
    let source = "json";

    if (mongoEnabled()) {
      try {
        const db = await getDb();
        const col = db.collection("products");
        product = await col.findOne({ id });
        source = "mongo";
      } catch (err) {
        mongoError = err;
        product = null;
      }
    }

    if (!product) {
      const products = await readProductsJson();
      product = products.find((p: any) => p.id === id);
      source = "json-fallback";
    }

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    product = enrichProductWithS3Images(product);

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "no-store",
        "X-Product-Source": source,
        "X-S3-Images-Enriched": "true",
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    const relevantError = mongoError || err;
    const hint = mongoTroubleshootingHint(relevantError);
    return NextResponse.json(
      {
        error: "Failed to load product",
        details: (relevantError as any)?.message || String(relevantError),
        ...(hint ? { hint } : null),
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
