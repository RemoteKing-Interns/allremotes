import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = 'shane@allremotes.com.au';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETURNS_JSON_PATH = path.resolve(process.cwd(), "returns.json");

export type ReturnStatus = "pending" | "approved" | "rejected" | "shipped" | "received" | "refunded" | "cancelled";

export type ReturnRequest = {
  id: string;
  orderId: string;
  orderDate: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  reason: "faulty" | "stopped_working";
  reasonDetails: string;
  condition?: string;
  photos?: string[];
  status: ReturnStatus;
  adminNotes?: string;
  resolution?: "refund" | "replacement" | "store_credit" | "rejected";
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  trackingNumber?: string;
  returnImages?: string[];
  receivedAt?: string;
  refundedAt?: string;
};

async function makeReturnId(): Promise<string> {
  if (mongoEnabled) {
    try {
      const db = await getDb();
      const result = await db.collection("counters").findOneAndUpdate(
        { _id: "returnId" as any },
        { $inc: { seq: 1 } } as any,
        { upsert: true, returnDocument: "after" }
      );
      const seq: number = (result as any)?.seq ?? (result as any)?.value?.seq ?? 1;
      return `RET-${String(seq).padStart(6, "0")}`;
    } catch {
      // fall through to file-based fallback
    }
  }
  const existing = readReturnsFile();
  const seq = existing.length + 1;
  return `RET-${String(seq).padStart(6, "0")}`;
}

function readReturnsFile(): ReturnRequest[] {
  try {
    const raw = fs.readFileSync(RETURNS_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ReturnRequest[]) : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

function writeReturnsFile(returns: ReturnRequest[]) {
  fs.writeFileSync(RETURNS_JSON_PATH, JSON.stringify(returns, null, 2) + "\n", "utf8");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");

    let returns: ReturnRequest[] = [];

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<ReturnRequest>("returns");
      const query: Record<string, any> = {};
      if (email) query.customerEmail = email;
      if (orderId) query.orderId = orderId;
      if (status) query.status = status;
      returns = await col.find(query).sort({ createdAt: -1 }).toArray() as ReturnRequest[];
    } else {
      returns = readReturnsFile();
      if (email) returns = returns.filter((r) => r.customerEmail === email);
      if (orderId) returns = returns.filter((r) => r.orderId === orderId);
      if (status) returns = returns.filter((r) => r.status === status);
      returns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json(returns, {
      headers: {
        "Cache-Control": "no-store",
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load returns", details: err?.message || String(err) },
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

    const {
      orderId,
      orderDate,
      customerEmail,
      customerName,
      items,
      reason,
      reasonDetails,
      condition,
      photos,
    } = body;

    if (!orderId || !customerEmail || !items || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, customerEmail, items, reason" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const now = new Date().toISOString();
    const returnRequest: ReturnRequest = {
      id: await makeReturnId(),
      orderId,
      orderDate: orderDate || now,
      customerEmail,
      customerName: customerName || "",
      items: Array.isArray(items) ? items : [],
      reason,
      reasonDetails: reasonDetails || "",
      condition: condition || "",
      photos: Array.isArray(photos) ? photos : [],
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection("returns");
      await col.insertOne({ ...returnRequest });
    } else {
      const returns = readReturnsFile();
      returns.push(returnRequest);
      writeReturnsFile(returns);
    }

    // Send email notification to admin (non-blocking)
    const itemsList = returnRequest.items
      .map((i) => `<li>${i.productName} &times; ${i.quantity}</li>`)
      .join('');
    const reasonLabel = reason === 'faulty' ? 'Faulty / Defective Product' : 'Stopped Working (No Physical Damage)';
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Return Request ${returnRequest.id} — Order ${orderId}`,
      html: `
        <h2>New Return Request</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;font-weight:600;color:#374151;width:140px;">Return ID</td><td style="padding:8px;">${returnRequest.id}</td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Order ID</td><td style="padding:8px;">${orderId}</td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Customer</td><td style="padding:8px;">${returnRequest.customerName} &lt;${customerEmail}&gt;</td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Reason</td><td style="padding:8px;">${reasonLabel}</td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Details</td><td style="padding:8px;">${reasonDetails || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Photos</td><td style="padding:8px;">${Array.isArray(photos) && photos.length > 0 ? `${photos.length} photo(s) attached` : 'None'}</td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Submitted</td><td style="padding:8px;">${new Date(now).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</td></tr>
        </table>
        <h3>Items</h3>
        <ul>${itemsList}</ul>
        <p style="margin-top:20px;font-size:13px;color:#6b7280;">Log in to the admin panel to review and process this return request.</p>
      `,
    }).catch((err) => console.error('[Returns] Failed to send admin email:', err));

    // Send confirmation email to customer (non-blocking)
    const customerItemsTable = returnRequest.items.map((i) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">${i.productName}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td>
      </tr>`).join('');
    sendEmail({
      to: customerEmail,
      subject: `Warranty Claim Received — ${returnRequest.id}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827;">
          <div style="background:#C0392B;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Warranty Claim Received</h1>
          </div>
          <div style="background:#fff;padding:32px 28px;border:1px solid #eee8e1;border-top:none;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 16px;">Hi <strong>${returnRequest.customerName || 'there'}</strong>,</p>
            <p style="margin:0 0 20px;color:#374151;">We've received your warranty claim and our team will review it within <strong>1–2 business days</strong>. Here's a summary of your submission:</p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:6px 0;font-weight:600;color:#6b7280;font-size:13px;width:140px;">Claim ID</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#111827;">${returnRequest.id}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-weight:600;color:#6b7280;font-size:13px;">Order ID</td>
                  <td style="padding:6px 0;font-size:13px;color:#111827;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-weight:600;color:#6b7280;font-size:13px;">Reason</td>
                  <td style="padding:6px 0;font-size:13px;color:#111827;">${reasonLabel}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-weight:600;color:#6b7280;font-size:13px;">Details</td>
                  <td style="padding:6px 0;font-size:13px;color:#111827;">${reasonDetails || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-weight:600;color:#6b7280;font-size:13px;">Photos submitted</td>
                  <td style="padding:6px 0;font-size:13px;color:#111827;">${Array.isArray(photos) && photos.length > 0 ? `${photos.length} photo(s)` : 'None'}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-weight:600;color:#6b7280;font-size:13px;">Submitted</td>
                  <td style="padding:6px 0;font-size:13px;color:#111827;">${new Date(now).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</td>
                </tr>
              </table>
            </div>

            <h3 style="margin:0 0 10px;font-size:15px;color:#111827;">Items in Claim</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="padding:10px 8px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;">Product</th>
                  <th style="padding:10px 8px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;">Qty</th>
                </tr>
              </thead>
              <tbody>${customerItemsTable}</tbody>
            </table>

            <div style="background:#fff8ed;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-weight:700;color:#92400e;font-size:14px;">What happens next?</p>
              <ul style="margin:0;padding-left:18px;color:#78350f;font-size:13px;line-height:1.8;">
                <li>We review your claim within <strong>1–2 business days</strong></li>
                <li>If approved, you ship the item back to us at your expense</li>
                <li>We inspect within <strong>10–15 business days</strong> of receiving it</li>
                <li>Resolution will be exchange or refund at our discretion</li>
              </ul>
            </div>

            <p style="font-size:13px;color:#6b7280;margin:0;">Questions? Reply to this email or contact us at <a href="mailto:info@allremotes.com.au" style="color:#C0392B;">info@allremotes.com.au</a></p>
          </div>
        </div>
      `,
    }).catch((err) => console.error('[Returns] Failed to send customer email:', err));

    return NextResponse.json(returnRequest, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create return request", details: err?.message || String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
