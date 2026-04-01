import fs from "fs/promises";
import path from "path";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
      ...CORS_HEADERS,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
