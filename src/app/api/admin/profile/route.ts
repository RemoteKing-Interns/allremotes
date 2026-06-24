import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { validatePassword } from "@/lib/password-policy";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/profile — return own profile (no password)
export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get("x-user-email");
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoEnabled()) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const db = await getDb();
    const user = await db.collection("admin_users").findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { password: _, adminResetPasswordToken: __, adminResetPasswordExpiry: ___, ...safe } = user;
    return NextResponse.json({ user: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/admin/profile — update own name or password
export async function PATCH(request: NextRequest) {
  try {
    const email = request.headers.get("x-user-email");
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoEnabled()) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const { name, currentPassword, newPassword } = await request.json();
    const db = await getDb();
    const collection = db.collection("admin_users");
    const user = await collection.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new one" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        return NextResponse.json({ error: "Password does not meet requirements", passwordErrors: validation.errors }, { status: 400 });
      }
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    await collection.updateOne({ _id: user._id }, { $set: updates });

    await serverLogger.info("admin_profile_updated", { email, fields: Object.keys(updates).filter(k => k !== "updatedAt" && k !== "password") }, { userEmail: email });

    const updated = await collection.findOne({ _id: user._id });
    const { password: _, adminResetPasswordToken: __, adminResetPasswordExpiry: ___, ...safe } = updated!;
    return NextResponse.json({ user: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
