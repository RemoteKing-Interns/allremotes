import { NextRequest, NextResponse } from "next/server";
import * as OTPAuth from "otpauth";
import { mongoEnabled, getDb } from "@/lib/mongo";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/2fa — verify a TOTP code and issue a 30-day device trust cookie
export async function POST(request: NextRequest) {
  try {
    const { email, totpCode, trustDevice } = await request.json();

    if (!email || !totpCode) {
      return NextResponse.json(
        { error: "Email and 2FA code are required" },
        { status: 400 }
      );
    }

    let adminUser: any = null;

    if (mongoEnabled()) {
      const db = await getDb();
      adminUser = await db.collection("admin_users").findOne({ email });
    } else {
      const adminUsers = JSON.parse(
        (typeof localStorage !== "undefined" && localStorage.getItem("admin_users")) || "[]"
      );
      adminUser = adminUsers.find((u: any) => u.email === email);
    }

    if (!adminUser || !adminUser.twoFactorSecret) {
      return NextResponse.json({ error: "2FA not configured for this user" }, { status: 404 });
    }

    const totp = new OTPAuth.TOTP({
      issuer: "All Remotes Admin",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(adminUser.twoFactorSecret),
    });

    const delta = totp.validate({ token: totpCode, window: 1 });

    if (delta === null) {
      return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    if (trustDevice) {
      // Issue a 30-day device trust cookie
      const trustToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

      // Store trust token in DB
      if (mongoEnabled()) {
        const db = await getDb();
        await db.collection("admin_device_trust").insertOne({
          email,
          token: trustToken,
          expiresAt,
          userAgent: request.headers.get("user-agent") || "",
          createdAt: new Date(),
        });
      }

      response.cookies.set("admin_device_trust", trustToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    console.error("Error verifying 2FA:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify 2FA" },
      { status: 500 }
    );
  }
}

// GET /api/admin/2fa?email=xxx — generate a new TOTP secret for setup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "admin";

    const secret = new OTPAuth.Secret({ size: 20 });

    const totp = new OTPAuth.TOTP({
      issuer: "All Remotes Admin",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    return NextResponse.json({
      secret: secret.base32,
      uri: totp.toString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate 2FA secret" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/2fa — check if device is trusted
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const trustToken = request.cookies.get("admin_device_trust")?.value;

    if (!email || !trustToken) {
      return NextResponse.json({ trusted: false });
    }

    if (mongoEnabled()) {
      const db = await getDb();
      const trust = await db.collection("admin_device_trust").findOne({
        email,
        token: trustToken,
        expiresAt: { $gt: new Date() },
      });
      return NextResponse.json({ trusted: !!trust });
    }

    return NextResponse.json({ trusted: false });
  } catch (error: any) {
    return NextResponse.json({ trusted: false });
  }
}
