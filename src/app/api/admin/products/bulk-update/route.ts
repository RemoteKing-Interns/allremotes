import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "No products provided" },
        { status: 400 }
      );
    }

    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not enabled" },
        { status: 503 }
      );
    }

    const db = await getDb();
    const collection = db.collection("products");

    const operations = products.map((product) => {
      const { id, _id, ...updates } = product;

      // Don't allow changing id or _id
      const safeUpdates = { ...updates };
      delete safeUpdates.id;
      delete safeUpdates._id;

      return {
        updateOne: {
          filter: { id },
          update: {
            $set: {
              ...safeUpdates,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };
    });

    const result = await collection.bulkWrite(operations);

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error: any) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update products" },
      { status: 500 }
    );
  }
}
