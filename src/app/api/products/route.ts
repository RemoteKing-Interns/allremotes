import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { readProductsJson } from "@/lib/products-json";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
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
  let mongoError: unknown = null;

  try {
    let products: any[] = [];
    let source = "json";

    // ✅ LOCAL MOCK (uncomment to use when testing, comment out for production)

    // products = [
    //   {
    //     id: 1,
    //     skuKey: "MOCK-001",
    //     title: "Mock Product",
    //     brand: "Test Brand",
    //     description: "This is a local mock product for testing.",
    //     price: 49.99,
    //     stock: 10,
    //     image: "/public/images/hero.jpg",
    //     category: "all",
    //   },
    // ];
    // return NextResponse.json(products, {
    //   headers: { "Cache-Control": "no-store" },
    // });

    if (mongoEnabled()) {
      try {
        const db = await getDb();
        const col = db.collection("products");
        products = await col.find({}).toArray();
        source = "mongo";
      } catch (err) {
        // Keep API available by falling back to JSON when MongoDB is unreachable.
        mongoError = err;
        products = await readProductsJson();
        source = "json-fallback";
      }
    } else {
      products = await readProductsJson();
    }

    return NextResponse.json(products, {
      headers: { 
        "Cache-Control": "no-store",
        "X-Products-Source": source,
        ...CORS_HEADERS 
      },
    });
  } catch (err: any) {
    const relevantError = mongoError || err;
    const hint = mongoTroubleshootingHint(relevantError);
    return NextResponse.json(
      {
        error: "Failed to load products",
        details: (relevantError as any)?.message || String(relevantError),
        ...(hint ? { hint } : null),
      },
      { 
        status: 500,
        headers: CORS_HEADERS 
      },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
