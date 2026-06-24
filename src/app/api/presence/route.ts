import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// In-memory store for non-Mongo fallback (resets on server restart)
const memoryPresence: Record<string, number> = {};

const ONLINE_THRESHOLD_MS = 30_000; // 30s — if last ping > 30s ago, mark offline

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400, headers: CORS_HEADERS });
    }

    const now = Date.now();

    if (mongoEnabled()) {
      const db = await getDb();
      await db.collection("presence").updateOne(
        { email },
        { $set: { email, lastSeenAt: now, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    } else {
      memoryPresence[email] = now;
    }

    return NextResponse.json({ ok: true, lastSeenAt: now }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    let lastSeenAt: number | null = null;

    if (mongoEnabled()) {
      const db = await getDb();
      const doc = await db.collection("presence").findOne({ email });
      lastSeenAt = doc?.lastSeenAt ?? null;
    } else {
      lastSeenAt = memoryPresence[email] ?? null;
    }

    const online = lastSeenAt !== null && Date.now() - lastSeenAt < ONLINE_THRESHOLD_MS;
    return NextResponse.json({ email, online, lastSeenAt }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
