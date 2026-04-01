import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { resetOrdersJson } from "@/lib/orders-json";
import { writeProductsJson } from "@/lib/products-json";
import { resetContentJson } from "@/lib/content-json";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONTENT_KEYS = ["home", "navigation", "reviews", "promotions", "settings"];

function resetAllowed() {
  if (process.env.ALLOW_ADMIN_RESET === "1") return true;
  return process.env.NODE_ENV !== "production";
}

export async function POST() {
  if (!resetAllowed()) {
    return NextResponse.json(
      { error: "Reset is disabled in production. Set ALLOW_ADMIN_RESET=1 to enable." },
      { 
        status: 403,
        headers: CORS_HEADERS 
      }
    );
  }

  try {
    if (mongoEnabled()) {
      const db = await getDb();
      await db.collection("products").deleteMany({});
      await db.collection("orders").deleteMany({});
      await db
        .collection<{ _id: string }>("content")
        .deleteMany({ _id: { $in: CONTENT_KEYS } });
    }

    await writeProductsJson([]);
    await resetOrdersJson();
    await resetContentJson(CONTENT_KEYS);

    return NextResponse.json({ ok: true }, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to reset data", details: err?.message || String(err) },
      { 
        status: 500,
        headers: CORS_HEADERS 
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
