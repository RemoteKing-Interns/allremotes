import { pickopsMongoEnabled, getPickopsDb } from "./pickops-mongo";

export interface PickopsItem {
  rk_sku: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PickopsPerOrder {
  orderId: string;
  customerName: string;
  items: PickopsItem[];
}

export interface PickopsAllOrdersInput {
  unleashedOrderNumber: string;  // Combined Unleashed SO number (for reference)
  groupLabel: string;
  perOrder: PickopsPerOrder[];   // One entry per individual allremotes order
  customerCode: string;
  customerName: string;
  warehouseCode: string;
  warehouseName: string;
  orderDate: string;
}

function buildWarehouseOrderDoc(
  orderId: string,
  orderCustomerName: string,
  items: PickopsItem[],
  input: Omit<PickopsAllOrdersInput, "perOrder">,
  now: Date
) {
  const orderDateMs = new Date(input.orderDate).getTime();

  const salesOrderLines = items.map((item, idx) => {
    const lineNumber = idx + 1;
    const unitPrice = item.unitPrice ?? 0;
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    const lineTax = Math.round(lineTotal * 0.1 * 100) / 100;
    return {
      LineNumber: lineNumber,
      LineType: null,
      Product: {
        Guid: null,
        ProductCode: item.rk_sku,
        ProductDescription: item.name,
      },
      ProductCode: item.rk_sku,
      ProductDescription: item.name,
      OrderQuantity: item.quantity,
      UnitPrice: unitPrice,
      LineTotal: lineTotal,
      TaxRate: 0.1,
      LineTax: lineTax,
      XeroTaxCode: "G.S.T.",
      Assembly: null,
      Guid: null,
      LastModifiedOn: `/Date(${now.getTime()})/`,
    };
  });

  const subTotal = Math.round(salesOrderLines.reduce((s, l) => s + l.LineTotal, 0) * 100) / 100;
  const taxTotal = Math.round(salesOrderLines.reduce((s, l) => s + l.LineTax, 0) * 100) / 100;

  const rawOrder = {
    OrderNumber: orderId,
    OrderDate: `/Date(${orderDateMs})/`,
    RequiredDate: `/Date(${orderDateMs})/`,
    CompletedDate: null,
    OrderStatus: "Parked",
    CustomOrderStatus: "Release to Pick",
    Customer: {
      CustomerCode: input.customerCode,
      CustomerName: orderCustomerName || input.customerName,
    },
    Warehouse: {
      WarehouseCode: input.warehouseCode,
      WarehouseName: input.warehouseName,
      IsDefault: true,
    },
    DeliveryName: "ALL REMOTES ORDER FROM WEBSITE",
    DeliveryStreetAddress: "ALL REMOTES ORDER FROM WEBSITE — NO NEED TO SHIP IT",
    DeliveryStreetAddress2: null,
    DeliverySuburb: null,
    DeliveryCity: "PICKUP",
    DeliveryRegion: null,
    DeliveryCountry: "Australia",
    DeliveryPostCode: null,
    DeliveryMethod: "Customer Pickup",
    DeliveryInstruction: "ALL REMOTES ORDER FROM WEBSITE — NO NEED TO SHIP IT",
    CustomerPickup: true,
    Comments: `AllRemotes order ${orderId} — group: ${input.groupLabel} — Unleashed SO: ${input.unleashedOrderNumber}`,
    Currency: { CurrencyCode: "AUD" },
    SubTotal: subTotal,
    TaxTotal: taxTotal,
    Total: Math.round((subTotal + taxTotal) * 100) / 100,
    SalesOrderLines: salesOrderLines,
    CreatedBy: "AllRemotes",
    LastModifiedOn: `/Date(${now.getTime()})/`,
  };

  const lines = items.map((item, idx) => ({
    lineId: `${orderId}-L${idx + 1}`,
    sku: item.rk_sku,
    description: item.name,
    binLocation: null,
    orderedQty: item.quantity,
    pickedQty: 0,
    isAssemblyComponent: false,
    parentAssemblySku: null,
    assemblyGuid: null,
  }));

  return { rawOrder, lines, subTotal, taxTotal };
}

export async function pushAllToPickops(input: PickopsAllOrdersInput): Promise<{ ok: boolean; pushed: number; error?: string }> {
  if (!pickopsMongoEnabled()) {
    return { ok: false, pushed: 0, error: "PICKOPS_MONGODB_URI not configured" };
  }

  if (!input.perOrder || input.perOrder.length === 0) {
    return { ok: false, pushed: 0, error: "No orders provided" };
  }

  try {
    const db = await getPickopsDb();
    const collection = db.collection("warehouseOrders");
    const now = new Date();
    const { perOrder, ...sharedInput } = input;

    await Promise.all(
      perOrder.map(async (order) => {
        const { rawOrder, lines } = buildWarehouseOrderDoc(
          order.orderId,
          order.customerName,
          order.items,
          sharedInput,
          now
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (collection as any).updateOne(
          { _id: order.orderId },
          {
            $set: {
              orderNumber: order.orderId,
              customerName: order.customerName || input.customerName,
              customer: input.customerCode,
              status: "pending" as const,
              orderDate: new Date(input.orderDate),
              requiredDate: new Date(input.orderDate),
              warehouseCode: input.warehouseCode,
              rawOrder,
              lines,
              currentCustomStatus: "Release to Pick",
              sourceCustomStatus: "Release to Pick",
              lastUpdatedAt: now,
              lastUpdatedBy: "allremotes-push",
              lastUpdatedUser: "AllRemotes",
              lastModifiedOnMs: now.getTime(),
              updatedAt: now,
              lastSyncAt: now,
              source: "unleashed" as const,
              productionJob: false,
              isProductionSubOrder: false,
              parentOrderNumber: null,
              productionSubOrders: [],
              pickupOverride: true,
            },
            $setOnInsert: {
              createdAt: now,
              history: [],
            },
          },
          { upsert: true }
        );
      })
    );

    console.log(`[PickOps] Pushed ${perOrder.length} individual warehouse orders (group: ${input.groupLabel}, Unleashed SO: ${input.unleashedOrderNumber})`);
    return { ok: true, pushed: perOrder.length };
  } catch (err: any) {
    console.error("[PickOps] Failed to push warehouse orders:", err?.message);
    return { ok: false, pushed: 0, error: err?.message };
  }
}
