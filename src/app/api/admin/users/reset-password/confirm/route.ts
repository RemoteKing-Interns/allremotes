import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validatePassword } from "@/lib/password-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// POST /api/admin/users/reset-password/confirm
// Body: { token: string, newPassword: string }
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Password does not meet requirements", passwordErrors: validation.errors },
        { status: 400 }
      );
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const db = await getDb();
    const collection = db.collection("admin_users");

    const hashedToken = hashToken(token);
    const adminUser = await collection.findOne({ adminResetPasswordToken: hashedToken });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (adminUser.adminResetPasswordExpiry && new Date() > new Date(adminUser.adminResetPasswordExpiry)) {
      return NextResponse.json(
        { error: "Reset token has expired. Please ask an admin to send a new link." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await collection.updateOne(
      { _id: adminUser._id },
      {
        $set: { password: hashedPassword, updatedAt: new Date() },
        $unset: { adminResetPasswordToken: "", adminResetPasswordExpiry: "" },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now log in.",
    });
  } catch (error: any) {
    console.error("Admin confirm reset error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
