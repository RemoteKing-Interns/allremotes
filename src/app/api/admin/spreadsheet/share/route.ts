import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generate a secure random token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Clean expired links from database
async function cleanExpiredLinks() {
  if (!mongoEnabled()) return;
  
  try {
    const db = await getDb();
    const collection = db.collection("share_links");
    const now = new Date();
    
    await collection.deleteMany({
      expiresAt: { $lt: now }
    });
  } catch (error) {
    console.error("Error cleaning expired links:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { permission, expiresInHours = 24, columns, shareMode } = await request.json();

    if (!["read", "edit"].includes(permission)) {
      return NextResponse.json(
        { error: "Permission must be 'read' or 'edit'" },
        { status: 400 }
      );
    }

    // Get user info from request
    const userEmail = request.headers.get("x-user-email") || "unknown";
    
    // Generate token and create link
    const token = generateToken();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresInHours * 60 * 60 * 1000);

    // Store in database if available, otherwise fallback to memory
    if (mongoEnabled()) {
      try {
        const db = await getDb();
        const collection = db.collection("share_links");
        
        await collection.insertOne({
          token,
          permission,
          createdAt,
          expiresAt,
          createdBy: userEmail,
          columns: columns || [],
          shareMode: shareMode || "all",
        });
      } catch (error) {
        console.error("Error storing share link in database:", error);
        // Continue with memory fallback
      }
    }

    const baseUrl = new URL(request.url).origin;
    const shareUrl = `${baseUrl}/admin/spreadsheet/shared/${token}`;

    return NextResponse.json({
      shareUrl,
      token,
      permission,
      expiresAt: expiresAt.toISOString(),
      expiresInHours,
      columns: columns || [],
      shareMode: shareMode || "all",
    });
  } catch (error: any) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create share link" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    await cleanExpiredLinks();

    // Try to get from database first
    let link = null;
    if (mongoEnabled()) {
      try {
        const db = await getDb();
        const collection = db.collection("share_links");
        
        link = await collection.findOne({ token });
        
        // Check if expired
        if (link && link.expiresAt < new Date()) {
          await collection.deleteOne({ token });
          link = null;
        }
      } catch (error) {
        console.error("Error retrieving share link from database:", error);
      }
    }

    if (!link) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      permission: link.permission,
      expiresAt: link.expiresAt.toISOString(),
      createdBy: link.createdBy,
      columns: link.columns || [],
      shareMode: link.shareMode || "all",
    });
  } catch (error: any) {
    console.error("Error validating share link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate share link" },
      { status: 500 }
    );
  }
}
