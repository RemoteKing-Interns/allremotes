import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { enrichProductWithS3Images } from "@/lib/products-json";

const CACHE_CONTROL = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("status") === "all";

  try {
    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const db = await getDb();
    const col = db.collection("products");
    const query: any = { id };
    if (!includeAll) {
      query.$or = [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
        { status: "" },
      ];
    }
    const product = await col.findOne(query);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(enrichProductWithS3Images(product), {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "X-Product-Source": "mongodb",
        "X-S3-Images-Enriched": "true",
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    const hint = mongoTroubleshootingHint(err);
    return NextResponse.json(
      {
        error: "Failed to load product",
        details: err?.message || String(err),
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
