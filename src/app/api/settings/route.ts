import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CONTENT_JSON_PATH = path.resolve(process.cwd(), "content.json");

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

export async function GET() {
  try {
    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: any }>("content");
      const doc = await col.findOne({ _id: "settings" });
      if (!doc) return NextResponse.json({ error: "Settings not found" }, { status: 404 });
      return NextResponse.json((doc as any).data ?? null);
    }

    const store = readContentStore();
    if (!store?.settings) return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    return NextResponse.json(store.settings?.data ?? null);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load settings", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: any; updatedAt: string }>("content");
      await col.updateOne(
        { _id: "settings" },
        { $set: { data: body, updatedAt } },
        { upsert: true }
      );
      return NextResponse.json({ success: true });
    }

    const store = readContentStore();
    store.settings = { ...(store.settings || {}), data: body, updatedAt };
    writeContentStore(store);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save settings", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
