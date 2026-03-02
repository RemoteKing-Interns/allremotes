import fs from "fs/promises";
import path from "path";

const CONTENT_JSON_PATH = path.resolve(process.cwd(), "content.json");

type ContentDoc = { data: any; updatedAt: string | null };
type ContentStore = Record<string, ContentDoc>;

async function ensureContentFile() {
  try {
    await fs.access(CONTENT_JSON_PATH);
  } catch {
    await fs.writeFile(CONTENT_JSON_PATH, JSON.stringify({}, null, 2) + "\n", "utf8");
  }
}

async function readAll(): Promise<ContentStore> {
  await ensureContentFile();
  const raw = await fs.readFile(CONTENT_JSON_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as ContentStore;
  } catch {
    // If the file is corrupted (partial write/manual edit), recover gracefully.
    const empty: ContentStore = {};
    await writeAll(empty);
    return empty;
  }
}

async function writeAll(store: ContentStore) {
  const tmpPath = `${CONTENT_JSON_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(store, null, 2) + "\n", "utf8");
  await fs.rename(tmpPath, CONTENT_JSON_PATH);
}

export async function readContentJson(key: string): Promise<ContentDoc> {
  const store = await readAll();
  const doc = store[key];
  if (!doc || typeof doc !== "object") return { data: null, updatedAt: null };
  return {
    data: (doc as any).data ?? null,
    updatedAt: (doc as any).updatedAt ?? null,
  };
}

export async function writeContentJson(key: string, data: any): Promise<{ updatedAt: string }> {
  const store = await readAll();
  const now = new Date().toISOString();
  store[key] = { data: data ?? null, updatedAt: now };
  await writeAll(store);
  return { updatedAt: now };
}

export async function resetContentJson(keys: string[]) {
  const store = await readAll();
  const now = new Date().toISOString();
  for (const key of keys) {
    store[key] = { data: null, updatedAt: now };
  }
  await writeAll(store);
}
