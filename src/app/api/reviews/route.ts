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

export async function GET() {
  try {
    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: any }>("content");
      const doc = await col.findOne({ _id: "reviews" });
      const data = (doc as any)?.data;
      if (!Array.isArray(data)) {
        return NextResponse.json({ error: "Reviews not found" }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    const store = readContentStore();
    const data = store?.reviews?.data;
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Reviews not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load reviews", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
