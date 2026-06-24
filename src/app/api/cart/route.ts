import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CART_ITEMS = 50;
const MAX_ITEM_QTY = 99;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ cart: [] });
    }

    const db = await getDb();
    const col = db.collection("carts");
    
    const query = userId ? { userId } : { email };
    const cartDoc = await col.findOne(query);

    if (!cartDoc) {
      return NextResponse.json({ cart: [] });
    }

    return NextResponse.json({ cart: cartDoc.items || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load cart", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, items } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items array" }, { status: 400 });
    }

    // Enforce limits
    const uniqueItems = items.slice(0, MAX_CART_ITEMS).map((item: any) => ({
      ...item,
      quantity: Math.min(Math.max(1, Number(item.quantity) || 1), MAX_ITEM_QTY),
    }));

    if (!mongoEnabled()) {
      return NextResponse.json({ success: true, cart: uniqueItems });
    }

    const db = await getDb();
    const col = db.collection("carts");
    
    const query = userId ? { userId } : { email };
    const updatedAt = new Date().toISOString();
    const createdAt = updatedAt;

    const result = await col.updateOne(
      query,
      { 
        $set: { 
          items: uniqueItems, 
          updatedAt,
          lastActivity: updatedAt,
          abandoned: false,
          ...(userId && { userId }),
          ...(email && { email })
        },
        $setOnInsert: { createdAt }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, cart: uniqueItems });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save cart", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, action, productId, quantity } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ success: true });
    }

    const db = await getDb();
    const col = db.collection("carts");
    
    const query = userId ? { userId } : { email };
    const cartDoc = await col.findOne(query);

    if (!cartDoc && action !== "mark_contacted") {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const updatedAt = new Date().toISOString();

    if (action === "mark_contacted") {
      await col.updateOne(
        query,
        { $set: { abandoned: true, contactedAt: updatedAt, updatedAt } }
      );
      return NextResponse.json({ success: true });
    }

    let items = cartDoc.items || [];

    if (action === "add") {
      const existingIndex = items.findIndex((item: any) => item.id === productId);
      if (existingIndex >= 0) {
        items[existingIndex].quantity = Math.min(items[existingIndex].quantity + (quantity || 1), MAX_ITEM_QTY);
      } else if (items.length < MAX_CART_ITEMS) {
        items.push({ id: productId, quantity: Math.min(quantity || 1, MAX_ITEM_QTY) });
      } else {
        return NextResponse.json({ error: `Cart limit reached (max ${MAX_CART_ITEMS} products)` }, { status: 400 });
      }
    } else if (action === "remove") {
      items = items.filter((item: any) => item.id !== productId);
    } else if (action === "update") {
      const existingIndex = items.findIndex((item: any) => item.id === productId);
      if (existingIndex >= 0) {
        if (quantity <= 0) {
          items = items.filter((item: any) => item.id !== productId);
        } else {
          items[existingIndex].quantity = quantity;
        }
      }
    } else if (action === "clear") {
      items = [];
    }

    await col.updateOne(
      query,
      { $set: { items, updatedAt } }
    );

    return NextResponse.json({ success: true, cart: items });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update cart", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ success: true });
    }

    const db = await getDb();
    const col = db.collection("carts");
    
    const query = userId ? { userId } : { email };
    await col.deleteOne(query);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete cart", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
