import { NextResponse } from "next/server";
import crypto from "crypto";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { pushAllToPickops } from "@/lib/pickops";

const UNLEASHED_BASE = "https://api.unleashedsoftware.com";

function signRequest(apiKey: string, queryString: string): string {
  return crypto
    .createHmac("sha256", apiKey)
    .update(queryString)
    .digest("base64");
}

function unleashedHeaders(apiId: string, apiKey: string, queryString = "") {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "api-auth-id": apiId,
    "api-auth-signature": signRequest(apiKey, queryString),
  };
}

export async function POST(request: Request) {
  const apiId = process.env.UNLEASHED_API_ID;
  const apiKey = process.env.UNLEASHED_API_KEY;
  const warehouseCode = process.env.UNLEASHED_WAREHOUSE_CODE || "MAIN";
  const customerCode = process.env.UNLEASHED_CUSTOMER_CODE || "8071848689959";
  const customerName = process.env.UNLEASHED_CUSTOMER_NAME || "All Remotes";
  const currencyCode = process.env.UNLEASHED_CURRENCY_CODE || "AUD";

  if (!apiId || !apiKey) {
    return NextResponse.json(
      { error: "Unleashed API credentials not configured. Set UNLEASHED_API_ID and UNLEASHED_API_KEY in .env.local" },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { groupLabel, selectedOrderIds, items: rawItems, perOrder: rawPerOrder, pushTargets } = body as {
    groupLabel: string;
    selectedOrderIds: string[];
    items: { id: string; name: string; sku: string; rk_sku?: string; quantity: number; unitPrice?: number }[];
    perOrder?: { orderId: string; customerName: string; items: { name: string; sku: string; rk_sku: string; quantity: number; unitPrice: number }[] }[];
    pushTargets?: { unleashed?: boolean; pickops?: boolean };
  };
  let items = rawItems;
  let perOrder = rawPerOrder || [];
  const pushUnleashed = pushTargets?.unleashed !== false;
  const pushPickops = pushTargets?.pickops !== false;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items to push" }, { status: 400 });
  }

  // For items missing rk_sku or unitPrice, look them up from the products collection
  const itemsNeedingLookup = items.filter((i) => (!i.rk_sku && i.sku) || !i.unitPrice);
  if (itemsNeedingLookup.length > 0 && mongoEnabled()) {
    try {
      const db = await getDb();
      const skus = items.map((i) => i.sku).filter(Boolean);
      const products = await db.collection("products").find({ sku: { $in: skus } }, { projection: { sku: 1, rk_sku: 1, price: 1 } }).toArray();
      const productMap: Record<string, { rk_sku?: string; price?: number }> = {};
      products.forEach((p: any) => { if (p.sku) productMap[p.sku] = { rk_sku: p.rk_sku, price: p.price }; });
      items = items.map((i) => {
        const match = i.sku ? productMap[i.sku] : undefined;
        return {
          ...i,
          rk_sku: i.rk_sku || match?.rk_sku || "",
          unitPrice: i.unitPrice || match?.price || 0,
        };
      });
      // Enrich perOrder items with the same productMap
      perOrder = perOrder.map((o) => ({
        ...o,
        items: o.items.map((i) => {
          const match = i.sku ? productMap[i.sku] : undefined;
          return {
            ...i,
            rk_sku: i.rk_sku || match?.rk_sku || "",
            unitPrice: i.unitPrice || match?.price || 0,
          };
        }),
      }));
    } catch {
      // Non-fatal — fall back to existing values
    }
  }

  // Generate a unique GUID for each push (timestamp ensures a new SO is created each time)
  const orderGuid = crypto
    .createHash("md5")
    .update(`${groupLabel}:${selectedOrderIds.sort().join(",")}:${Date.now()}`)
    .digest("hex")
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");

  const now = new Date();
  const orderDate = now.toISOString().split("T")[0];
  // Format a human-readable date for comments e.g. "30 Jun 2026"
  const dateLabel = now.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  const GST_RATE = 0.1;
  const GST_CODE = "G.S.T.";
  const GST_GUID = "1b6da60b-93ef-44cf-acd9-7555da74c7ef"; // IsSalesDefault: true

  const salesOrderLines = items.map((item, idx) => {
    const unitPrice = item.unitPrice ?? 0;
    const lineTotal = unitPrice * item.quantity;
    const lineTax = Math.round(lineTotal * GST_RATE * 100) / 100;
    return {
      LineNumber: idx + 1,
      Product: {
        ProductCode: item.rk_sku || item.sku || item.name,
      },
      OrderQuantity: item.quantity,
      UnitPrice: unitPrice,
      LineTotal: lineTotal,
      TaxRate: GST_RATE,
      LineTax: lineTax,
    };
  });

  const subTotal = Math.round(salesOrderLines.reduce((s, l) => s + l.LineTotal, 0) * 100) / 100;
  const taxTotal = Math.round(salesOrderLines.reduce((s, l) => s + l.LineTax, 0) * 100) / 100;

  const payload = {
    Guid: orderGuid,
    OrderDate: orderDate,
    RequiredDate: orderDate,
    OrderStatus: "Parked",
    SubTotal: subTotal,
    TaxTotal: taxTotal,
    Total: Math.round((subTotal + taxTotal) * 100) / 100,
    Customer: {
      CustomerCode: customerCode,
      CustomerName: customerName,
    },
    Warehouse: {
      WarehouseCode: warehouseCode,
    },
    Currency: {
      CurrencyCode: currencyCode,
    },
    Tax: {
      TaxCode: GST_CODE,
      TaxRate: GST_RATE,
      Guid: GST_GUID,
    },
    DeliveryName: "ALL REMOTES ORDER FROM WEBSITE",
    DeliveryStreetAddress: "ALL REMOTES ORDER FROM WEBSITE — NO NEED TO SHIP IT",
    DeliveryCity: "PICKUP",
    DeliveryCountry: "AU",
    DeliveryMethod: "Customer Pickup",
    DeliveryInstruction: "ALL REMOTES ORDER FROM WEBSITE — NO NEED TO SHIP IT",
    Comments: `From AllRemotes Website (ALWAYS PICKUP ORDERS) — date: ${dateLabel} — group: ${groupLabel} — orders: ${selectedOrderIds.join(", ")}`,
    SalesOrderLines: salesOrderLines,
  };

  let orderNumber = "";
  let orderUrl = "";

  if (pushUnleashed) {
    const endpoint = `/SalesOrders/${orderGuid}`;
    const url = `${UNLEASHED_BASE}${endpoint}`;

    let unleashedRes: Response;
    try {
      unleashedRes = await fetch(url, {
        method: "POST",
        headers: unleashedHeaders(apiId, apiKey),
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Failed to reach Unleashed API", details: err?.message },
        { status: 502 }
      );
    }

    const text = await unleashedRes.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!unleashedRes.ok) {
      return NextResponse.json(
        { error: "Unleashed API error", status: unleashedRes.status, details: data },
        { status: unleashedRes.status }
      );
    }

    orderNumber = data?.OrderNumber ?? data?.SalesOrderNumber ?? data?.orderNumber ?? "";
    orderUrl = orderNumber
      ? `https://app.unleashedsoftware.com/SalesOrders?searchString=${encodeURIComponent(orderNumber)}`
      : "";
  }

  // Persist Unleashed data directly to MongoDB so it survives page refreshes
  if (mongoEnabled()) {
    try {
      const db = await getDb();
      await db.collection("orders").updateMany(
        { id: { $in: selectedOrderIds } },
        {
          $set: {
            unleashedOrderNumber: orderNumber,
            unleashedOrderUrl: orderUrl,
            unleashedOrderGuid: orderGuid,
            unleashedPushedAt: new Date().toISOString(),
          },
        }
      );
    } catch {
      // Non-fatal — data already returned to client
    }
  }

  // Push to PickOps warehouseOrders — one doc per individual order (non-fatal)
  if (pushPickops) pushAllToPickops({
    unleashedOrderNumber: orderNumber,
    groupLabel,
    perOrder,
    customerCode,
    customerName,
    warehouseCode,
    warehouseName: process.env.UNLEASHED_WAREHOUSE_NAME || "Remote King Warehouse",
    orderDate: now.toISOString(),
  }).catch((err) => console.error("[PickOps] push error:", err?.message));

  return NextResponse.json({ success: true, orderNumber, orderUrl, orderGuid });
}
