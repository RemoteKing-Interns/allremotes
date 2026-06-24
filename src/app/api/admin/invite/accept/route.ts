import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import * as OTPAuth from "otpauth";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/invite/accept — complete invite: set password + 2FA
export async function POST(request: NextRequest) {
  try {
    const { token, password, totpCode, totpSecret } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    let invite: any = null;

    if (mongoEnabled()) {
      const db = await getDb();
      invite = await db.collection("admin_invites").findOne({ token, used: false });
    } else {
      const invites = JSON.parse(
        (typeof localStorage !== "undefined" && localStorage.getItem("admin_invites")) || "[]"
      );
      invite = invites.find((i: any) => i.token === token && !i.used);
    }

    if (!invite) {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This invite link has expired" }, { status: 410 });
    }

    // Validate TOTP if secret provided
    if (totpSecret && totpCode) {
      const totp = new OTPAuth.TOTP({
        issuer: "All Remotes Admin",
        label: invite.email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecret),
      });

      const delta = totp.validate({ token: totpCode, window: 1 });
      if (delta === null) {
        return NextResponse.json({ error: "Invalid 2FA code. Please try again." }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin: any = {
      name: invite.name,
      email: invite.email,
      password: hashedPassword,
      permissions: invite.permissions,
      role: "admin",
      twoFactorSecret: totpSecret || null,
      twoFactorEnabled: !!totpSecret,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (mongoEnabled()) {
      const db = await getDb();
      // Check if user already exists (e.g. re-accepting)
      await db.collection("admin_users").deleteMany({ email: invite.email });
      await db.collection("admin_users").insertOne(newAdmin);
      // Mark invite as used
      await db.collection("admin_invites").updateOne(
        { token },
        { $set: { used: true, usedAt: new Date() } }
      );
    } else {
      const adminUsers = JSON.parse(
        (typeof localStorage !== "undefined" && localStorage.getItem("admin_users")) || "[]"
      );
      const filtered = adminUsers.filter((u: any) => u.email !== invite.email);
      filtered.push({ ...newAdmin, id: Date.now().toString() });
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("admin_users", JSON.stringify(filtered));

        const invites = JSON.parse(localStorage.getItem("admin_invites") || "[]");
        const updatedInvites = invites.map((i: any) =>
          i.token === token ? { ...i, used: true, usedAt: new Date() } : i
        );
        localStorage.setItem("admin_invites", JSON.stringify(updatedInvites));
      }
    }

    await serverLogger.info('invite_accepted', {
      email: invite.email,
      name: invite.name,
      twoFactorEnabled: !!totpSecret,
    }, { userEmail: invite.email });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept invite" },
      { status: 500 }
    );
  }
}
