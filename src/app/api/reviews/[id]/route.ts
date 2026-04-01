import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CONTENT_JSON_PATH = path.resolve(process.cwd(), "content.json");

type ContentStore = Record<string, { data: any; updatedAt?: string }>;

type Review = Record<string, any> & { id: string };

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { 
      status: 400,
      headers: CORS_HEADERS 
    });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { 
        status: 400,
        headers: CORS_HEADERS 
      });
    }

    const patch = { ...(body as Record<string, any>) };
    delete (patch as any).id;
    const updatedAt = new Date().toISOString();

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: Review[]; updatedAt: string }>("content");
      const doc = await col.findOne({ _id: "reviews" });
      const data = Array.isArray((doc as any)?.data) ? ((doc as any).data as Review[]) : [];
      const idx = data.findIndex((r) => r.id === id);
      if (idx === -1) return NextResponse.json({ error: "Review not found" }, { 
        status: 404,
        headers: CORS_HEADERS 
      });
      data[idx] = { ...data[idx], ...patch, id };
      await col.updateOne({ _id: "reviews" }, { $set: { data, updatedAt } }, { upsert: true });
      return NextResponse.json(data[idx], {
        headers: CORS_HEADERS
      });
    }

    const store = readContentStore();
    const list = Array.isArray(store?.reviews?.data) ? (store.reviews.data as Review[]) : [];
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return NextResponse.json({ error: "Review not found" }, { 
      status: 404,
      headers: CORS_HEADERS 
    });
    list[idx] = { ...list[idx], ...patch, id };
    store.reviews = { ...(store.reviews || {}), data: list, updatedAt };
    writeContentStore(store);
    return NextResponse.json(list[idx], {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update review", details: err?.message || String(err) },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { 
      status: 400,
      headers: CORS_HEADERS 
    });

    const updatedAt = new Date().toISOString();

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: Review[]; updatedAt: string }>("content");
      const doc = await col.findOne({ _id: "reviews" });
      const data = Array.isArray((doc as any)?.data) ? ((doc as any).data as Review[]) : [];
      const next = data.filter((r) => r.id !== id);
      if (next.length === data.length) {
        return NextResponse.json({ error: "Review not found" }, { 
          status: 404,
          headers: CORS_HEADERS 
        });
      }
      await col.updateOne({ _id: "reviews" }, { $set: { data: next, updatedAt } }, { upsert: true });
      return NextResponse.json({ success: true }, {
        headers: CORS_HEADERS
      });
    }

    const store = readContentStore();
    const list = Array.isArray(store?.reviews?.data) ? (store.reviews.data as Review[]) : [];
    const next = list.filter((r) => r.id !== id);
    if (next.length === list.length) {
      return NextResponse.json({ error: "Review not found" }, { 
        status: 404,
        headers: CORS_HEADERS 
      });
    }
    store.reviews = { ...(store.reviews || {}), data: next, updatedAt };
    writeContentStore(store);
    return NextResponse.json({ success: true }, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete review", details: err?.message || String(err) },
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
