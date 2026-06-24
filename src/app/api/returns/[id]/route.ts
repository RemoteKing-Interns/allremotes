import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import type { ReturnRequest, ReturnStatus } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETURNS_JSON_PATH = path.resolve(process.cwd(), "returns.json");

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

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<ReturnRequest>("returns");
      const returnRequest = await col.findOne({ id });
      if (!returnRequest) return NextResponse.json({ error: "Return not found" }, { status: 404 });
      return NextResponse.json(returnRequest);
    }

    const returns = readReturnsFile();
    const returnRequest = returns.find((r) => r.id === id);
    if (!returnRequest) return NextResponse.json({ error: "Return not found" }, { status: 404 });
    return NextResponse.json(returnRequest);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load return", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    const updates: Partial<ReturnRequest> = { updatedAt };

    if (body.status) {
      updates.status = body.status as ReturnStatus;
      if (body.status === 'approved') updates.approvedAt = updatedAt;
      if (body.status === 'received') updates.receivedAt = updatedAt;
      if (body.status === 'refunded') updates.refundedAt = updatedAt;
    }
    if (body.adminNotes !== undefined) updates.adminNotes = body.adminNotes;
    if (body.resolution) updates.resolution = body.resolution;
    if (body.refundAmount !== undefined) updates.refundAmount = Number(body.refundAmount);
    if (body.trackingNumber) updates.trackingNumber = body.trackingNumber;
    if (body.returnImages) updates.returnImages = body.returnImages;

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<ReturnRequest>("returns");
      const res = await col.findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: "after" }
      );
      if (!res) return NextResponse.json({ error: "Return not found" }, { status: 404 });
      return NextResponse.json(res);
    }

    const returns = readReturnsFile();
    const idx = returns.findIndex((r) => r.id === id);
    if (idx === -1) return NextResponse.json({ error: "Return not found" }, { status: 404 });
    
    const updated = { ...returns[idx], ...updates };
    returns[idx] = updated;
    writeReturnsFile(returns);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update return", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<ReturnRequest>("returns");
      const res = await col.deleteOne({ id });
      if (res.deletedCount === 0) return NextResponse.json({ error: "Return not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    const returns = readReturnsFile();
    const idx = returns.findIndex((r) => r.id === id);
    if (idx === -1) return NextResponse.json({ error: "Return not found" }, { status: 404 });
    
    returns.splice(idx, 1);
    writeReturnsFile(returns);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete return", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
