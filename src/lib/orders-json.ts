import fs from "fs/promises";
import path from "path";

const ORDERS_JSON_PATH = path.resolve(process.cwd(), "orders.json");

export type OrderDoc = {
  id: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
  customer: {
    fullName: string;
    email: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  pricing: {
    currency: string;
    subtotal: number;
    discountTotal: number;
    total: number;
    hasMemberDiscount: boolean;
    memberDiscountRate: number;
  };
  items: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

async function ensureOrdersFile() {
  try {
    await fs.access(ORDERS_JSON_PATH);
  } catch {
    await fs.writeFile(ORDERS_JSON_PATH, JSON.stringify([], null, 2) + "\n", "utf8");
  }
}

export async function readOrdersJson(): Promise<OrderDoc[]> {
  await ensureOrdersFile();
  const raw = await fs.readFile(ORDERS_JSON_PATH, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? (data as OrderDoc[]) : [];
}

export async function writeOrdersJson(orders: OrderDoc[]) {
  const tmpPath = `${ORDERS_JSON_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(orders, null, 2) + "\n", "utf8");
  await fs.rename(tmpPath, ORDERS_JSON_PATH);
}

export async function appendOrderJson(order: OrderDoc) {
  const orders = await readOrdersJson();
  orders.unshift(order);
  await writeOrdersJson(orders);
}

export async function resetOrdersJson() {
  await writeOrdersJson([]);
}

