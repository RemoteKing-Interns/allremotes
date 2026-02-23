import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const templatePath = path.resolve(process.cwd(), "public", "products-template.csv");
  let body = "Product Code,Product Description,Product Group,Sell Price,Default Sell Price,Image Url\n";
  try {
    body = await fs.readFile(templatePath, "utf8");
  } catch {
    // fallback above
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="products-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
