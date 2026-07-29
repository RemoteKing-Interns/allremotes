import { NextResponse } from "next/server";
import { getCategoryMappings, setCategoryMapping } from "@/lib/channels/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel") || undefined;
  try {
    const mappings = await getCategoryMappings(channel);
    return NextResponse.json({ ok: true, mappings });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load category mappings", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.channel || !body?.internalCategory || !body?.externalCategoryId) {
      return NextResponse.json({ error: "Missing channel, internalCategory, or externalCategoryId" }, { status: 400 });
    }
    await setCategoryMapping(body.channel, body.internalCategory, body.externalCategoryId, body.externalCategoryName);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save category mapping", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
