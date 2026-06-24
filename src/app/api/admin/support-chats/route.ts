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

export type ThreadWithDetails = SupportThread & {
  latestMessage?: string;
  unreadCount: number;
  orderDetails?: any;
  returnDetails?: any;
};

export async function GET() {
  try {
    if (!mongoEnabled()) {
      return NextResponse.json([], { headers: CORS_HEADERS });
    }

    const db = await getDb();
    const threadsCol = db.collection<SupportThread>("support_threads");
    const messagesCol = db.collection<ChatMessage>("support_messages");
    const ordersCol = db.collection("orders");
    const returnsCol = db.collection("returns");

    const threads = await threadsCol
      .find({})
      .sort({ lastMessageAt: -1 })
      .toArray();

    const threadsWithDetails: ThreadWithDetails[] = await Promise.all(
      threads.map(async (thread) => {
        // Get unread count (customer messages not read by admin)
        const unreadCount = await messagesCol.countDocuments({
          threadId: thread.id,
          sender: "customer",
          read: false,
        });

        // Get latest message
        const latestMessage = await messagesCol
          .find({ threadId: thread.id })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        let orderDetails = null;
        let returnDetails = null;

        if (thread.orderId) {
          orderDetails = await ordersCol.findOne({ id: thread.orderId });
        }

        if (thread.returnId) {
          returnDetails = await returnsCol.findOne({ id: thread.returnId });
        }

        return {
          ...thread,
          latestMessage: latestMessage[0]?.message || "",
          unreadCount,
          orderDetails,
          returnDetails,
        };
      })
    );

    return NextResponse.json(threadsWithDetails, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load chats", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
