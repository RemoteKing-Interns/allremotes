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
    const { id, name, fields, layout } = body;

    if (!name || !fields || !layout) {
      return NextResponse.json(
        { error: "Missing required fields: name, fields, layout" },
        { status: 400 }
      );
    }

    // If id is provided, update existing; otherwise create new
    if (id && mongoEnabled()) {
      const db = await getDb();
      const existing = await db.collection("labelTemplates").findOne({ id });
      if (existing) {
        await db.collection("labelTemplates").updateOne(
          { id },
          { $set: { name, fields, layout, updatedAt: new Date().toISOString() } }
        );
        return NextResponse.json({ id, name, fields, layout, updatedAt: new Date().toISOString() });
      }
    }

    const templateId = id || `template_${Date.now()}`;
    const template = {
      id: templateId,
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
      { error: "Failed to save label template", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    if (mongoEnabled()) {
      const db = await getDb();
      await db.collection("labelTemplates").deleteOne({ id });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete label template", details: error?.message },
      { status: 500 }
    );
  }
}
