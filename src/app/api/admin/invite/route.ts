import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import { serverLogger } from "@/lib/server-logger";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSiteUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// POST /api/admin/invite — send an invite to a new admin user
export async function POST(request: NextRequest) {
  try {
    const { email, name, permissions } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 72); // 72 hours

    const invite = {
      email,
      name,
      permissions: permissions || ["*"],
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };

    if (mongoEnabled()) {
      const db = await getDb();
      // Prevent duplicate pending invites for same email
      await db.collection("admin_invites").deleteMany({ email, used: false });
      await db.collection("admin_invites").insertOne(invite);
    } else {
      const invites = JSON.parse(
        (typeof localStorage !== "undefined" && localStorage.getItem("admin_invites")) || "[]"
      );
      const filtered = invites.filter((i: any) => !(i.email === email && !i.used));
      filtered.push({ ...invite, id: Date.now().toString() });
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("admin_invites", JSON.stringify(filtered));
      }
    }

    const acceptUrl = `${getSiteUrl(request)}/admin/accept-invite?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation - All Remotes</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
    .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #92400e; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .link-box { background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>All Remotes Admin</h1>
    </div>
    <div class="content">
      <h2>You've been invited to join the admin team</h2>
      <p>Hi ${name},</p>
      <p>You've been invited to access the <strong>All Remotes</strong> admin panel. Click the button below to set up your account.</p>

      <div class="info-box">
        <strong>What you'll set up:</strong><br>
        &bull; Your own password<br>
        &bull; Two-factor authentication (2FA) for security
      </div>

      <center>
        <a href="${acceptUrl}" class="button">Accept Invitation &amp; Set Up Account</a>
      </center>

      <p style="font-size: 14px; color: #6b7280; margin-top: 10px; text-align: center;">Or copy this link:</p>
      <div class="link-box">${acceptUrl}</div>

      <div class="warning">
        <strong>This invite link expires in 72 hours.</strong> If you didn't expect this invitation, please ignore this email.
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} All Remotes. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const emailResult = await sendEmail({
      to: email,
      subject: "You've been invited to the All Remotes admin panel",
      html,
    });

    if (!emailResult.success) {
      console.error("Failed to send invite email:", emailResult.error);
      await serverLogger.warn('invite_email_failed', { email, name, error: emailResult.error });
      return NextResponse.json({
        success: true,
        emailSent: false,
        acceptUrl,
        warning: "Invite created but email could not be sent. Share the link manually.",
      });
    }

    await serverLogger.info('invite_sent', { email, name, permissions }, { userEmail: email });
    return NextResponse.json({ success: true, emailSent: true });
  } catch (error: any) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invite" },
      { status: 500 }
    );
  }
}

// GET /api/admin/invite — list all invites OR ?token=xxx validate a single token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Validate a specific token (used by accept-invite page)
    if (token) {
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

      return NextResponse.json({
        valid: true,
        email: invite.email,
        name: invite.name,
        permissions: invite.permissions,
      });
    }

    // List all invites (for admin management view)
    let invites: any[] = [];

    if (mongoEnabled()) {
      const db = await getDb();
      invites = await db
        .collection("admin_invites")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      invites = JSON.parse(
        (typeof localStorage !== "undefined" && localStorage.getItem("admin_invites")) || "[]"
      );
      invites.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Compute status for each
    const now = new Date();
    const enriched = invites.map((inv: any) => ({
      id: inv._id?.toString() || inv.id,
      email: inv.email,
      name: inv.name,
      permissions: inv.permissions,
      token: inv.token,
      used: inv.used,
      usedAt: inv.usedAt,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      status: inv.used
        ? "accepted"
        : new Date(inv.expiresAt) < now
        ? "expired"
        : "pending",
    }));

    return NextResponse.json({ invites: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/invite?id=xxx — revoke (delete) an invite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const token = searchParams.get("token");

    if (!id && !token) {
      return NextResponse.json({ error: "id or token is required" }, { status: 400 });
    }

    if (mongoEnabled()) {
      const db = await getDb();
      const query: any = id ? { _id: new ObjectId(id) } : { token };
      await db.collection("admin_invites").deleteOne(query);
    } else {
      const invites = JSON.parse(
        (typeof localStorage !== "undefined" && localStorage.getItem("admin_invites")) || "[]"
      );
      const filtered = invites.filter(
        (i: any) => (id ? i.id !== id : i.token !== token)
      );
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("admin_invites", JSON.stringify(filtered));
      }
    }

    await serverLogger.warn('invite_revoked', { email: id || token });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
