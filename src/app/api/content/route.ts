import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CONTENT_JSON_PATH = path.resolve(process.cwd(), "content.json");
const ALLOWED = new Set(["home", "navigation", "reviews", "promotions", "settings"]);

type ContentStore = Record<string, { data: any; updatedAt?: string }>;

function readContentStore(): ContentStore {
  try {
    const raw = fs.readFileSync(CONTENT_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ContentStore) : {};
  } catch (err: any) {
    if (err?.code === "ENOENT") return {};
    throw err;
  }
}

function writeContentStore(store: ContentStore) {
  fs.writeFileSync(CONTENT_JSON_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = String(searchParams.get("section") || "").trim().toLowerCase();
  if (!section) return NextResponse.json({ error: "Missing section" }, { 
    status: 400,
    headers: CORS_HEADERS 
  });
  if (!ALLOWED.has(section)) return NextResponse.json({ error: "Unknown section" }, { 
    status: 404,
    headers: CORS_HEADERS 
  });

  try {
    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: any; updatedAt: string }>("content");
      const doc = await col.findOne({ _id: section });
      if (!doc) return NextResponse.json({ error: "Section not found" }, { 
        status: 404,
        headers: CORS_HEADERS 
      });
      return NextResponse.json({ data: (doc as any).data ?? null }, {
        headers: CORS_HEADERS
      });
    }

    const store = readContentStore();
    if (!store?.[section]) return NextResponse.json({ error: "Section not found" }, { 
      status: 404,
      headers: CORS_HEADERS 
    });
    return NextResponse.json({ data: store[section]?.data ?? null }, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load content", details: err?.message || String(err) },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const section = String(body?.section || "").trim().toLowerCase();
    if (!section) return NextResponse.json({ error: "Missing section" }, { 
      status: 400,
      headers: CORS_HEADERS 
    });
    if (!ALLOWED.has(section)) return NextResponse.json({ error: "Unknown section" }, { 
      status: 404,
      headers: CORS_HEADERS 
    });

    const data = body?.data;
    const updatedAt = new Date().toISOString();

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: any; updatedAt: string }>("content");
      await col.updateOne(
        { _id: section },
        { $set: { data: data ?? null, updatedAt } },
        { upsert: true }
      );
      return NextResponse.json({ success: true }, {
        headers: CORS_HEADERS
      });
    }

    const store = readContentStore();
    store[section] = { ...(store[section] || {}), data: data ?? null, updatedAt };
    writeContentStore(store);
    return NextResponse.json({ success: true }, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save content", details: err?.message || String(err) },
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
