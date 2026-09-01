import { NextRequest, NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import bcrypt from "bcryptjs";
import { serverLogger } from "@/lib/server-logger";
import { ObjectId } from "mongodb";
import { encrypt, decryptPii, decryptPiiArray, emailHash, PII_FIELDS } from "@/lib/pii-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Get all customers — derived from orders collection (all channels)
export async function GET() {
  try {
    if (!mongoEnabled()) {
      return NextResponse.json({ customers: [], analytics: {} });
    }

    const db = await getDb();
    const ordersCol = db.collection("orders");

    // Aggregate customers from orders by emailHash (deterministic) or username fallback
    const pipeline = [
      {
        $match: {
          $or: [
            { "customer.emailHash": { $exists: true, $nin: [null, ""] } },
            { "customer.email": { $exists: true, $nin: [null, ""] } },
            { "customer.username": { $exists: true, $nin: [null, ""] } },
          ],
        },
      },
      {
        $addFields: {
          customerKey: {
            $ifNull: [
              { $ifNull: ["$customer.emailHash", { $trim: { input: { $toLower: "$customer.email" } } }] },
              { $concat: ["username:", { $toLower: { $ifNull: ["$customer.username", ""] } }] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$customerKey",
          name: { $first: { $ifNull: ["$customer.fullName", "$customer.username", "$customer.email"] } },
          email: { $first: { $ifNull: ["$customer.email", ""] } },
          username: { $first: { $ifNull: ["$customer.username", ""] } },
          phone: { $first: { $ifNull: ["$shipping.phone", "$customer.phone"] } },
          city: { $first: "$shipping.city" },
          state: { $first: "$shipping.state" },
          street: { $first: "$shipping.address" },
          zip: { $first: "$shipping.zipCode" },
          country: { $first: "$shipping.country" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $toDouble: { $ifNull: ["$pricing.total", 0] } } },
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" },
          orderIds: { $push: "$id" },
          channels: { $addToSet: { $ifNull: ["$channel", "website"] } },
          channelOrders: {
            $push: {
              channel: { $ifNull: ["$channel", "website"] },
              total: { $toDouble: { $ifNull: ["$pricing.total", 0] } },
              orderId: "$id",
              date: "$createdAt",
            },
          },
        },
      },
      { $sort: { totalSpent: -1 } },
    ];

    const aggregated = await ordersCol.aggregate(pipeline).toArray();

    // Decrypt PII fields after aggregation
    const decryptedAggregated = decryptPiiArray(aggregated, [
      "name", "email", "username", "phone", "street", "city", "state", "zip", "country",
    ]);

    // Build per-channel breakdown for each customer
    const customers = decryptedAggregated.map((c: any) => {
      const channelMap: Record<string, { orders: number; spent: number }> = {};
      for (const co of c.channelOrders || []) {
        const ch = co.channel || "website";
        if (!channelMap[ch]) channelMap[ch] = { orders: 0, spent: 0 };
        channelMap[ch].orders++;
        channelMap[ch].spent += Number(co.total || 0);
      }

      return {
        _id: c._id,
        name: c.name || c.email || c.username || "Unknown",
        email: c.email || "",
        username: c.username || "",
        phone: c.phone || "",
        address: {
          street: c.street || "",
          city: c.city || "",
          state: c.state || "",
          zip: c.zip || "",
          country: c.country || "Australia",
        },
        totalOrders: c.totalOrders,
        totalSpent: Number(c.totalSpent || 0),
        firstOrderDate: c.firstOrderDate,
        lastOrderDate: c.lastOrderDate,
        registrationDate: c.firstOrderDate,
        orderIds: c.orderIds || [],
        channels: c.channels || ["website"],
        channelBreakdown: Object.entries(channelMap).map(([channel, data]) => ({
          channel,
          orders: data.orders,
          spent: Number(data.spent.toFixed(2)),
        })),
        status: "active",
        createdAt: c.firstOrderDate,
        updatedAt: c.lastOrderDate,
      };
    });

    // Build overall analytics
    const channelSet = new Set<string>();
    const channelRevenue: Record<string, number> = {};
    const channelOrderCount: Record<string, number> = {};
    for (const c of customers) {
      for (const cb of c.channelBreakdown) {
        channelSet.add(cb.channel);
        channelRevenue[cb.channel] = (channelRevenue[cb.channel] || 0) + cb.spent;
        channelOrderCount[cb.channel] = (channelOrderCount[cb.channel] || 0) + cb.orders;
      }
    }

    const analytics = {
      totalCustomers: customers.length,
      totalRevenue: customers.reduce((s, c) => s + c.totalSpent, 0),
      totalOrders: customers.reduce((s, c) => s + c.totalOrders, 0),
      avgOrderValue: customers.length > 0
        ? customers.reduce((s, c) => s + c.totalSpent, 0) / customers.reduce((s, c) => s + c.totalOrders, 0)
        : 0,
      returningCustomers: customers.filter(c => c.totalOrders > 1).length,
      topCustomers: customers
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5)
        .map(c => ({ name: c.name, email: c.email, totalSpent: c.totalSpent, totalOrders: c.totalOrders, channels: c.channels })),
      channelDistribution: Array.from(channelSet).map(ch => ({
        channel: ch,
        customers: customers.filter(c => c.channels.includes(ch)).length,
        orders: channelOrderCount[ch] || 0,
        revenue: Number((channelRevenue[ch] || 0).toFixed(2)),
      })).sort((a, b) => b.revenue - a.revenue),
    };

    return NextResponse.json({ customers, analytics });
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
      name: encrypt(name),
      email: encrypt(email),
      emailHash: emailHash(email),
      phone: encrypt(phone || ""),
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
    const existingCustomer = await collection.findOne({ $or: [{ emailHash: emailHash(email) }, { email }] });
    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer with this email already exists" },
        { status: 409 }
      );
    }

    const result = await collection.insertOne(newCustomer);
    newCustomer._id = result.insertedId;

    // Decrypt for response
    const responseCustomer = { ...newCustomer };
    decryptPii(responseCustomer, ["name", "email", "phone"]);

    await serverLogger.info('customer_created', { name, email }, { userEmail: email });
    return NextResponse.json({ customer: responseCustomer });
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
    if (updatedCustomer) decryptPii(updatedCustomer, ["name", "email", "phone"]);

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

// Delete customer and all their orders
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const customerKey = searchParams.get("key");
    const deleteOrders = searchParams.get("deleteOrders") !== "false"; // default true

    if (!email && !customerKey) {
      return NextResponse.json(
        { error: "Customer email or key is required" },
        { status: 400 }
      );
    }

    if (!mongoEnabled()) {
      return NextResponse.json({ success: true, deletedOrders: 0 });
    }

    const db = await getDb();
    const ordersCol = db.collection("orders");

    // Build query: match by emailHash, or by username key (for channel customers without email)
    let query: any;
    if (email) {
      query = { "customer.emailHash": emailHash(email) };
    } else if (customerKey?.startsWith("username:")) {
      const username = customerKey.replace("username:", "");
      query = { "customer.username": { $regex: new RegExp(`^${username}$`, "i") } };
    } else {
      query = { "customer.emailHash": customerKey };
    }

    // Count matching orders first
    const orderCount = await ordersCol.countDocuments(query);

    if (deleteOrders) {
      // Delete all orders for this customer
      const result = await ordersCol.deleteMany(query);
      await serverLogger.warn('customer_deleted', { email: email || customerKey, deletedOrders: result.deletedCount });
      return NextResponse.json({
        success: true,
        deletedOrders: result.deletedCount,
        message: `Deleted ${result.deletedCount} order(s) for this customer`,
      });
    } else {
      // Just return the count without deleting
      return NextResponse.json({
        success: true,
        orderCount,
        message: `Found ${orderCount} order(s) for this customer`,
      });
    }
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
