import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "../../../../lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (mongoEnabled()) {
      const db = await getDb();
      const templates = await db.collection("labelTemplates").find({}).toArray();
      return NextResponse.json(templates);
    }
    
    // File-based fallback
    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to load label templates", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, fields, layout } = body;

    if (!name || !fields || !layout) {
      return NextResponse.json(
        { error: "Missing required fields: name, fields, layout" },
        { status: 400 }
      );
    }

    const template = {
      id: `template_${Date.now()}`,
      name,
      fields,
      layout,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (mongoEnabled()) {
      const db = await getDb();
      await db.collection("labelTemplates").insertOne(template);
    }

    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create label template", details: error?.message },
      { status: 500 }
    );
  }
}
