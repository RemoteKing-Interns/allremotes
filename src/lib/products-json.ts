import fs from "fs/promises";
import path from "path";

const PRODUCTS_JSON_PATH = path.resolve(process.cwd(), "products.json");

async function ensureProductsFile() {
  try {
    await fs.access(PRODUCTS_JSON_PATH);
  } catch {
    await fs.writeFile(PRODUCTS_JSON_PATH, JSON.stringify([], null, 2) + "\n", "utf8");
  }
}

export async function readProductsJson(): Promise<any[]> {
  await ensureProductsFile();
  const raw = await fs.readFile(PRODUCTS_JSON_PATH, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

export async function writeProductsJson(products: any[]) {
  const tmpPath = `${PRODUCTS_JSON_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(products, null, 2) + "\n", "utf8");
  await fs.rename(tmpPath, PRODUCTS_JSON_PATH);
}

