import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { DEFAULT_PACKING_SLIP_TEMPLATE } from "@/lib/packingSlip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TEMPLATES_JSON_PATH = path.resolve(process.cwd(), "document-templates.json");

type TemplateDoc = {
  _id: string;
  html: string;
  updatedAt: string;
};

function readTemplatesFile(): Record<string, { html: string; updatedAt: string }> {
  try {
    const raw = fs.readFileSync(TEMPLATES_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, { html: string; updatedAt: string }>) : {};
  } catch (err: any) {
    if (err?.code === "ENOENT") return {};
    throw err;
  }
}

function writeTemplatesFile(store: Record<string, { html: string; updatedAt: string }>) {
  fs.writeFileSync(TEMPLATES_JSON_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

async function loadTemplate(key: string): Promise<{ html: string; updatedAt: string }> {
  if (mongoEnabled()) {
    const db = await getDb();
    const col = db.collection<TemplateDoc>("documentTemplates");
    const doc = await col.findOne({ _id: key });
    if (doc) {
      if (doc.html.includes("<!DOCTYPE html>") || doc.html.includes("</html>")) {
        const now = new Date().toISOString();
        await col.updateOne({ _id: key }, { $set: { html: DEFAULT_PACKING_SLIP_TEMPLATE, updatedAt: now } });
        return { html: DEFAULT_PACKING_SLIP_TEMPLATE, updatedAt: now };
      }
      return { html: doc.html, updatedAt: doc.updatedAt };
    }
  } else {
    const store = readTemplatesFile();
    if (store[key]) {
      if (store[key].html.includes("<!DOCTYPE html>") || store[key].html.includes("</html>")) {
        const now = new Date().toISOString();
        store[key] = { html: DEFAULT_PACKING_SLIP_TEMPLATE, updatedAt: now };
        writeTemplatesFile(store);
        return store[key];
      }
      return store[key];
    }
  }

  // first read: seed the default and persist it
  const now = new Date().toISOString();
  const seed = { html: DEFAULT_PACKING_SLIP_TEMPLATE, updatedAt: now };

  if (mongoEnabled()) {
    const db = await getDb();
    const col = db.collection<TemplateDoc>("documentTemplates");
    await col.updateOne({ _id: key }, { $set: { html: seed.html, updatedAt: now } }, { upsert: true });
  } else {
    const store = readTemplatesFile();
    store[key] = seed;
    writeTemplatesFile(store);
  }

  return seed;
}

async function saveTemplate(key: string, html: string) {
  const now = new Date().toISOString();
  if (mongoEnabled()) {
    const db = await getDb();
    const col = db.collection<TemplateDoc>("documentTemplates");
    await col.updateOne({ _id: key }, { $set: { html, updatedAt: now } }, { upsert: true });
  } else {
    const store = readTemplatesFile();
    store[key] = { html, updatedAt: now };
    writeTemplatesFile(store);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key") || "packing-slip";
    const template = await loadTemplate(key);
    return NextResponse.json({ key, ...template });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load document template", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || typeof body.html !== "string") {
      return NextResponse.json({ error: "Invalid body: html string is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key") || body.key || "packing-slip";

    await saveTemplate(key, body.html);
    return NextResponse.json({ ok: true, key });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save document template", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
