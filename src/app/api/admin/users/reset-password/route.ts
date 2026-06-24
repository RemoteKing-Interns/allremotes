import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { serverLogger } from "@/lib/server-logger";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// POST /api/admin/users/reset-password
// Body: { targetUserId: string }
// Generates a reset token, stores it hashed, emails the target admin — never returns the link
export async function POST(request: NextRequest) {
  try {
    const { targetUserId } = await request.json();
    const requestingAdmin = request.headers.get("x-user-email") || "unknown";

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const db = await getDb();
    const collection = db.collection("admin_users");

    const { ObjectId } = await import("mongodb");
    const targetUser = await collection.findOne({ _id: new ObjectId(targetUserId) });

    if (!targetUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const resetToken = generateResetToken();
    const hashedToken = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await collection.updateOne(
      { _id: new ObjectId(targetUserId) },
      {
        $set: {
          adminResetPasswordToken: hashedToken,
          adminResetPasswordExpiry: expiresAt.toISOString(),
          updatedAt: new Date(),
        },
      }
    );

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://allremotes.com.au";

    const resetUrl = `${origin}/admin/reset-password?token=${resetToken}`;

    await sendEmail({
      to: targetUser.email,
      subject: "Admin Password Reset — All Remotes",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Password Reset</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1a1a1a;padding:24px 32px;">
      <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">All Remotes Admin</p>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px;">Password Reset Request</h2>
      <p style="color:#555;font-size:15px;margin:0 0 8px;">Hi ${targetUser.name},</p>
      <p style="color:#555;font-size:15px;margin:0 0 24px;">
        An admin has requested a password reset for your account. Click the button below to set a new password.
        This link expires in <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;background:#1A7A6E;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
        Reset My Password
      </a>
      <p style="color:#999;font-size:13px;margin:24px 0 0;">
        If you didn't expect this email, you can safely ignore it. The link will expire automatically.
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    await serverLogger.info(
      "admin_password_reset_sent",
      { targetEmail: targetUser.email, targetName: targetUser.name },
      { userEmail: requestingAdmin }
    );

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${targetUser.email}`,
    });
  } catch (error: any) {
    console.error("Admin reset password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send reset email" },
      { status: 500 }
    );
  }
}
