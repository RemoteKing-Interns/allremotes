import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import bcrypt from "bcryptjs";
import { serverLogger } from "@/lib/server-logger";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Get all customers
export async function GET() {
  try {
    if (!mongoEnabled()) {
      // Fallback to localStorage for development
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      return NextResponse.json({ customers });
    }

    const db = await getDb();
    const customers = await db.collection("customers").find({}).toArray();
    
    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// Create new customer
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, address, status, notes } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const newCustomer: any = {
      name,
      email,
      phone: phone || "",
      address: address || {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      status: status || "active",
      notes: notes || "",
      totalOrders: 0,
      totalSpent: 0,
      registrationDate: new Date().toISOString(),
      lastOrderDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!mongoEnabled()) {
      // Fallback to localStorage for development
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Check if customer already exists
      if (customers.find(u => u.email === email)) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 409 }
        );
      }

      const customerWithId = { ...newCustomer, id: Date.now().toString() };
      customers.push(customerWithId);
      localStorage.setItem('customers', JSON.stringify(customers));

      return NextResponse.json({ customer: customerWithId });
    }

    const db = await getDb();
    const collection = db.collection("customers");

    // Check if customer already exists
    const existingCustomer = await collection.findOne({ email });
    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer with this email already exists" },
        { status: 409 }
      );
    }

    const result = await collection.insertOne(newCustomer);
    newCustomer._id = result.insertedId;

    await serverLogger.info('customer_created', { name, email }, { userEmail: email });
    return NextResponse.json({ customer: newCustomer });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}

// Update customer
export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    if (!mongoEnabled()) {
      // Fallback to localStorage for development
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customerIndex = customers.findIndex(u => u.id === id);
      
      if (customerIndex === -1) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      customers[customerIndex] = { ...customers[customerIndex], ...updateData };
      localStorage.setItem('customers', JSON.stringify(customers));

      return NextResponse.json({ customer: customers[customerIndex] });
    }

    const db = await getDb();
    const collection = db.collection("customers");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get updated customer
    const updatedCustomer = await collection.findOne({ _id: new ObjectId(id) });

    await serverLogger.info('customer_updated', { id, changes: Object.keys(updates) });
    return NextResponse.json({ customer: updatedCustomer });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}

// Delete customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!mongoEnabled()) {
      // Fallback to localStorage for development
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const filteredCustomers = customers.filter(u => u.id !== id);
      
      if (customers.length === filteredCustomers.length) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      localStorage.setItem('customers', JSON.stringify(filteredCustomers));
      return NextResponse.json({ success: true });
    }

    const db = await getDb();
    const collection = db.collection("customers");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    await serverLogger.warn('customer_deleted', { id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
