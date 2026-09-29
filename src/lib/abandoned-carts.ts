import type { Db } from "mongodb";

const key = (v: any) => String(v ?? "").trim().toLowerCase();

// Build match keys for an item — id/sku/externalId are unique per product;
// name is the fallback for legacy orders stored without skus.
const itemKeys = (it: any): string[] => {
  const keys: string[] = [];
  if (key(it?.id)) keys.push(`id:${key(it.id)}`);
  if (key(it?.sku)) keys.push(`sku:${key(it.sku)}`);
  if (key(it?.externalId)) keys.push(`sku:${key(it.externalId)}`);
  if (key(it?.name)) keys.push(`name:${key(it.name)}`);
  return keys;
};

// Names of cart items already present in any of the given orders.
export function matchCartItemsAgainstOrders(cartItems: any[], orders: any[]): string[] {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return [];
  const cartKeys = new Set<string>();
  for (const it of cartItems) for (const k of itemKeys(it)) cartKeys.add(k);
  if (cartKeys.size === 0) return [];

  const matched = new Set<string>();
  for (const order of orders) {
    for (const it of order.items || []) {
      if (itemKeys(it).some((k) => cartKeys.has(k))) {
        matched.add(String(it.name || it.sku || it.id));
      }
    }
  }
  return [...matched];
}

// Names of cart items the same customer (matched by emailHash) has already ordered.
export async function findPreviouslyOrderedItems(db: Db, cart: any): Promise<string[]> {
  if (!cart?.emailHash) return [];
  const orders = await db
    .collection("orders")
    .find(
      { "customer.emailHash": cart.emailHash, status: { $ne: "cancelled" } },
      { projection: { items: 1 } }
    )
    .toArray();
  return matchCartItemsAgainstOrders(cart.items, orders);
}
