import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Normalise any raw category string → canonical key
function normaliseCategory(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!s || s === "all") return null;
  if (s.includes("garage") || s.includes("gate") || s.includes("door")) return "garage";
  if (s.includes("home") || s.includes("house")) return "home";
  if (s.includes("lock")) return "locksmith";
  return s;
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  garage: "Garage & Gate",
  home: "For The Home",
  locksmith: "Locksmithing",
};

export async function GET() {
  try {
    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured." },
        { status: 503 }
      );
    }

    const db = await getDb();
    const products = await db.collection("products").find({}).toArray();

    const countMap: Record<string, number> = {};
    products.forEach((p) => {
      const raw = p.category || p.cat1 || "";
      const key = normaliseCategory(raw);
      if (key) countMap[key] = (countMap[key] || 0) + 1;
    });

    const categories = Object.entries(countMap)
      .map(([key, count]) => ({
        key,
        name: CATEGORY_DISPLAY_NAMES[key] || (key.charAt(0).toUpperCase() + key.slice(1)),
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(categories, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load categories", details: err?.message },
      { status: 500 }
    );
  }
}
