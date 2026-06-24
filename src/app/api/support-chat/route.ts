import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export type ChatMessage = {
  id: string;
  threadId: string;
  orderId?: string;
  returnId?: string;
  customerEmail: string;
  sender: "customer" | "admin";
  message: string;
  attachments?: string[];
  read: boolean;
  createdAt: string;
};

export type SupportThread = {
  id: string;
  orderId?: string;
  returnId?: string;
  customerEmail: string;
  customerName: string;
  status: "open" | "closed";
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

function makeMessageId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MSG-${stamp}-${rand}`;
}

function makeThreadId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `THR-${stamp}-${rand}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get("customerEmail");
    const orderId = searchParams.get("orderId");
    const returnId = searchParams.get("returnId");
    const threadId = searchParams.get("threadId");

    if (mongoEnabled()) {
      const db = await getDb();

      if (threadId) {
        // Get messages for a specific thread
        const messagesCol = db.collection<ChatMessage>("support_messages");
        const messages = await messagesCol
          .find({ threadId })
          .sort({ createdAt: 1 })
          .toArray();

        return NextResponse.json(messages, { headers: CORS_HEADERS });
      } else {
        // Get threads for a customer or order/return
        const threadsCol = db.collection<SupportThread>("support_threads");
        const query: Record<string, any> = {};
        if (customerEmail) query.customerEmail = customerEmail;
        if (orderId) query.orderId = orderId;
        if (returnId) query.returnId = returnId;

        const threads = await threadsCol
          .find(query)
          .sort({ lastMessageAt: -1 })
          .toArray();

        return NextResponse.json(threads, { headers: CORS_HEADERS });
      }
    } else {
      // File-based fallback not implemented for chat
      return NextResponse.json(
        { error: "Chat requires MongoDB" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load chat", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: CORS_HEADERS });
    }

    const { orderId, returnId, customerEmail, customerName, sender, message, attachments, threadId } = body;

    if (!customerEmail || !sender || !message) {
      return NextResponse.json(
        { error: "Missing required fields: customerEmail, sender, message" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!orderId && !returnId) {
      return NextResponse.json(
        { error: "Either orderId or returnId is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const now = new Date().toISOString();
    const db = await getDb();

    // Get or create thread
    let thread: SupportThread | null = null;
    const threadsCol = db.collection<SupportThread>("support_threads");

    if (threadId) {
      thread = await threadsCol.findOne({ id: threadId });
    } else {
      thread = await threadsCol.findOne({
        customerEmail,
        $or: [{ orderId }, { returnId }],
      });
    }

    if (!thread) {
      thread = {
        id: makeThreadId(),
        orderId,
        returnId,
        customerEmail,
        customerName: customerName || "",
        status: "open",
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await threadsCol.insertOne(thread);
    } else {
      await threadsCol.updateOne(
        { id: thread.id },
        { $set: { lastMessageAt: now, updatedAt: now } }
      );
    }

    // Create message
    const newMessage: ChatMessage = {
      id: makeMessageId(),
      threadId: thread.id,
      orderId,
      returnId,
      customerEmail,
      sender,
      message,
      attachments: Array.isArray(attachments) ? attachments : [],
      read: sender === "admin", // Admin messages are read by customer, customer messages unread by admin
      createdAt: now,
    };

    const messagesCol = db.collection<ChatMessage>("support_messages");
    await messagesCol.insertOne(newMessage);

    return NextResponse.json({ thread, message: newMessage }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to send message", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { threadId, status, markAsRead } = body;

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();

    if (status) {
      // Update thread status
      const threadsCol = db.collection<SupportThread>("support_threads");
      await threadsCol.updateOne(
        { id: threadId },
        { $set: { status, updatedAt: now } }
      );
    }

    if (markAsRead) {
      // Mark messages as read
      const messagesCol = db.collection<ChatMessage>("support_messages");
      await messagesCol.updateMany(
        { threadId, read: false },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update chat", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
