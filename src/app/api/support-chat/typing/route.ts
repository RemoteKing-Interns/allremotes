import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// In-memory typing state (expires after 5s)
const memoryTyping: Record<string, { sender: string; expiresAt: number }> = {};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { threadId, sender } = body || {};
    if (!threadId || !sender) {
      return NextResponse.json({ error: "threadId and sender required" }, { status: 400, headers: CORS_HEADERS });
    }

    const expiresAt = Date.now() + 5000; // typing indicator lasts 5s

    if (mongoEnabled()) {
      const db = await getDb();
      await db.collection("typing_indicators").updateOne(
        { threadId },
        { $set: { threadId, sender, expiresAt, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    } else {
      memoryTyping[threadId] = { sender, expiresAt };
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    let typing: { sender: string; expiresAt: number } | null = null;

    if (mongoEnabled()) {
      const db = await getDb();
      const doc = await db.collection("typing_indicators").findOne({ threadId });
      if (doc && doc.expiresAt > Date.now()) {
        typing = { sender: doc.sender, expiresAt: doc.expiresAt };
      }
    } else {
      const mem = memoryTyping[threadId];
      if (mem && mem.expiresAt > Date.now()) {
        typing = mem;
      }
    }

    return NextResponse.json({ threadId, typing }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
