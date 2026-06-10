/**
 * Starshipit API integration
 * Docs: https://api-docs.starshipit.com/
 *
 * Required env vars:
 *   STARSHIPIT_API_KEY            — from Settings > API in Starshipit
 *   STARSHIPIT_SUBSCRIPTION_KEY   — from Settings > API in Starshipit
 */

const STARSHIPIT_BASE = "https://api.starshipit.com/api";

function getHeaders() {
  const apiKey = process.env.STARSHIPIT_API_KEY;
  const subKey = process.env.STARSHIPIT_SUBSCRIPTION_KEY;

  if (!apiKey || !subKey) {
    throw new Error(
      "Missing Starshipit credentials: set STARSHIPIT_API_KEY and STARSHIPIT_SUBSCRIPTION_KEY in .env.local"
    );
  }

  return {
    "Content-Type": "application/json",
    "StarShipIT-Api-Key": apiKey,
    "Ocp-Apim-Subscription-Key": subKey,
  };
}

export type StarshipitItem = {
  sku: string;
  description: string;
  quantity: number;
  unit_price?: number;
  weight?: number;
};

export type StarshipitOrderPayload = {
  order_number: string;
  order_date: string;
  shipping_method?: string;
  currency?: string;
  destination: {
    name: string;
    email?: string;
    phone?: string;
    street: string;
    suburb?: string;
    city: string;
    state: string;
    post_code: string;
    country: string;
  };
  items: StarshipitItem[];
  packages?: Array<{
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
  }>;
};

export type StarshipitSuccess = { success: true; order_id: number | string };
export type StarshipitFailure = { success: false; error: string; details?: unknown };
export type StarshipitResult = StarshipitSuccess | StarshipitFailure;

/**
 * Push a single order to Starshipit.
 * Returns success/failure without throwing — caller decides whether to surface the error.
 */
export async function pushOrderToStarshipit(
  payload: StarshipitOrderPayload
): Promise<StarshipitResult> {
  try {
    const res = await fetch(`${STARSHIPIT_BASE}/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ order: payload }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: `Starshipit responded ${res.status}`,
        details: json,
      };
    }

    const orderId = json?.order?.order_id ?? json?.order_id ?? "unknown";
    return { success: true, order_id: orderId };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Map an internal order (from /api/orders) to the Starshipit payload shape.
 */
export function mapOrderToStarshipit(order: Record<string, any>): StarshipitOrderPayload {
  const shipping = order.shipping ?? {};
  const customer = order.customer ?? {};
  const items: StarshipitItem[] = (order.items ?? []).map((item: any) => ({
    sku: item.id ?? item.sku ?? "UNKNOWN",
    description: item.name ?? "Product",
    quantity: item.quantity ?? 1,
    unit_price: item.unitPrice,
  }));

  return {
    order_number: order.id,
    order_date: order.createdAt ?? new Date().toISOString(),
    currency: order.pricing?.currency ?? "AUD",
    destination: {
      name: customer.fullName ?? customer.name ?? "Customer",
      email: customer.email,
      street: shipping.address ?? "",
      city: shipping.city ?? "",
      state: shipping.state ?? "",
      post_code: shipping.zipCode ?? shipping.postCode ?? "",
      country: shipping.country ?? "AU",
    },
    items,
  };
}
