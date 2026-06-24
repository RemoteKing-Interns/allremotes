import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import bcrypt from "bcryptjs";
import { serverLogger } from "@/lib/server-logger";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Get all admin users
export async function GET() {
  try {
    if (!mongoEnabled()) {
      // Fallback to localStorage for development
      const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
      return NextResponse.json({ users: adminUsers });
    }

    const db = await getDb();
    const users = await db.collection("admin_users").find({}).toArray();
    
    // Remove passwords from response
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    return NextResponse.json({ users: safeUsers });
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Create new admin user
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, permissions } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate permissions
    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions array is required" },
        { status: 400 }
      );
    }

    // Ensure this creates an admin user, not a customer
    if (!permissions.includes("*") && !permissions.some(p => p.startsWith("/admin/"))) {
      return NextResponse.json(
        { error: "Admin users must have at least one admin permission" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser: any = {
      name,
      email,
      password: hashedPassword,
      permissions, // e.g., ["*"] for full access or ["/admin/spreadsheet"] for specific routes
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!mongoEnabled()) {
      // Fallback to localStorage for development
      const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
      
      // Check if admin user already exists
      if (adminUsers.find(u => u.email === email)) {
        return NextResponse.json(
          { error: "Admin user with this email already exists" },
          { status: 409 }
        );
      }

      const userWithId = { ...newUser, id: Date.now().toString() };
      adminUsers.push(userWithId);
      localStorage.setItem('admin_users', JSON.stringify(adminUsers));

      // Remove password from response
      const { password, ...safeUser } = userWithId;
      return NextResponse.json({ user: safeUser });
    }

    const db = await getDb();
    const collection = db.collection("admin_users");

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const result = await collection.insertOne(newUser);
    
    // Remove password from response
    const { password: _, ...safeUser } = newUser;
    safeUser._id = result.insertedId;

    await serverLogger.info('admin_user_created', { name, email, permissions }, { userEmail: email });
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

// Update admin user
export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Don't allow password changes through this endpoint
    if (updates.password) {
      return NextResponse.json(
        { error: "Password changes not allowed through this endpoint" },
        { status: 400 }
      );
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    if (!mongoEnabled()) {
      // Fallback to localStorage for development
      const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
      const userIndex = adminUsers.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        return NextResponse.json(
          { error: "Admin user not found" },
          { status: 404 }
        );
      }

      adminUsers[userIndex] = { ...adminUsers[userIndex], ...updateData };
      localStorage.setItem('admin_users', JSON.stringify(adminUsers));

      // Remove password from response
      const { password, ...safeUser } = adminUsers[userIndex];
      return NextResponse.json({ user: safeUser });
    }

    const db = await getDb();
    const collection = db.collection("admin_users");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get updated user
    const updatedUser = await collection.findOne({ _id: new ObjectId(id) });
    
    // Remove password from response
    const { password, ...safeUser } = updatedUser;

    await serverLogger.info('admin_user_updated', { id, changes: Object.keys(updates) });
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete admin user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!mongoEnabled()) {
      // Fallback to localStorage for development
      const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
      const filteredUsers = adminUsers.filter(u => u.id !== id);
      
      if (adminUsers.length === filteredUsers.length) {
        return NextResponse.json(
          { error: "Admin user not found" },
          { status: 404 }
        );
      }

      localStorage.setItem('admin_users', JSON.stringify(filteredUsers));
      return NextResponse.json({ success: true });
    }

    const db = await getDb();
    const collection = db.collection("admin_users");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await serverLogger.warn('admin_user_deleted', { id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting admin user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
