import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CompleteKey {
  car_brand: string;
  title: string;
  manufacturer: string;
  vehicle: string;
  chip: string;
  frequency: string;
  buttons: string;
  blade: string;
  product_url: string;
  image_url: string;
  description: string;
  comments?: string;
}

// GET - Fetch keys with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = await getDb();
    const collection = db.collection<CompleteKey>("complete_keys");

    const query: any = {};
    if (brand) query.car_brand = brand;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { vehicle: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { chip: { $regex: search, $options: 'i' } },
        { blade: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await collection.countDocuments(query);
    const keys = await collection
      .find(query)
      .sort({ car_brand: 1, title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Get all unique brands for filter dropdown
    const brands = await collection.distinct('car_brand');

    return NextResponse.json({ keys, total, brands, page, limit });
  } catch (error: any) {
    console.error("Error fetching complete keys:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch keys" },
      { status: 500 }
    );
  }
}

// POST - Import keys from JSON data
export async function POST(request: NextRequest) {
  try {
    const { keys } = await request.json();

    if (!Array.isArray(keys)) {
      return NextResponse.json(
        { error: "Keys array is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<CompleteKey>("complete_keys");

    // Clear existing data
    await collection.deleteMany({});

    // Insert new data
    const result = await collection.insertMany(keys);

    // Create indexes for better search performance
    await collection.createIndex({ car_brand: 1 });
    await collection.createIndex({ title: "text", vehicle: "text", manufacturer: "text", chip: "text", blade: "text" });

    return NextResponse.json({
      success: true,
      inserted: result.insertedCount,
      message: `Successfully imported ${result.insertedCount} keys`
    });
  } catch (error: any) {
    console.error("Error importing complete keys:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import keys" },
      { status: 500 }
    );
  }
}

// PATCH - Update comment for a specific key
export async function PATCH(request: NextRequest) {
  try {
    const { id, comment } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Key ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<CompleteKey>("complete_keys");

    const result = await collection.updateOne(
      { _id: id },
      { $set: { comments: comment } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Comment updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update comment" },
      { status: 500 }
    );
  }
}
