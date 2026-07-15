const STARSHIPIT_BASE = "https://api.starshipit.com";

function starshipitHeaders() {
  const apiKey = process.env.STARSHIPIT_API_KEY;
  const subscriptionKey = process.env.STARSHIPIT_SUBSCRIPTION_KEY;

  if (!apiKey || !subscriptionKey) {
    throw new Error("STARSHIPIT_API_KEY and STARSHIPIT_SUBSCRIPTION_KEY must be set in .env.local");
  }

  return {
    "Content-Type": "application/json",
    "StarShipIT-Api-Key": apiKey,
    "Ocp-Apim-Subscription-Key": subscriptionKey,
  };
}

export function starshipitConfigured() {
  return Boolean(process.env.STARSHIPIT_API_KEY && process.env.STARSHIPIT_SUBSCRIPTION_KEY);
}

const AUSTRALIAN_STATE_CODES: Record<string, string> = {
  "Australian Capital Territory": "ACT",
  "New South Wales": "NSW",
  "Northern Territory": "NT",
  "Queensland": "QLD",
  "South Australia": "SA",
  "Tasmania": "TAS",
  "Victoria": "VIC",
  "Western Australia": "WA",
  "Jervis Bay Territory": "JBT",
};

export function normalizeStateCode(state?: string): string | undefined {
  if (!state) return undefined;
  const trimmed = state.trim();
  const upper = trimmed.toUpperCase();
  const knownCode = AUSTRALIAN_STATE_CODES[trimmed];
  if (knownCode) return knownCode;
  const lower = trimmed.toLowerCase();
  const fullNameMatch = Object.keys(AUSTRALIAN_STATE_CODES).find(
    (name) => name.toLowerCase() === lower
  );
  if (fullNameMatch) return AUSTRALIAN_STATE_CODES[fullNameMatch];
  if (Object.values(AUSTRALIAN_STATE_CODES).includes(upper)) return upper;
  return trimmed;
}

export function normalizeCountryCode(country?: string): string | undefined {
  if (!country) return undefined;
  const trimmed = country.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "australia" || lower === "au") return "AU";
  return trimmed.toUpperCase();
}

export function normalizeCountryName(country?: string): string | undefined {
  if (!country) return undefined;
  const trimmed = country.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "au" || lower === "australia") return "Australia";
  return trimmed;
}

export interface StarshipitAddress {
  street: string;
  suburb?: string;
  city?: string;
  state?: string;
  post_code: string;
  country_code: string;
}

export interface StarshipitPackage {
  weight: number;
  height?: number;
  width?: number;
  length?: number;
}

export async function getStarshipitRates({
  destination,
  packages,
  sender,
}: {
  destination: StarshipitAddress;
  packages: StarshipitPackage[];
  sender?: StarshipitAddress;
}) {
  const body: any = {
    destination,
    packages,
    currency: "AUD",
  };

  if (sender) {
    body.sender = sender;
  }

  const res = await fetch(`${STARSHIPIT_BASE}/api/rates`, {
    method: "POST",
    headers: starshipitHeaders(),
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Starshipit rates error: ${res.status} ${data?.errors?.map((e: any) => e.message).join(", ") || data?.message || text}`);
  }

  return (data?.rates || []) as Array<{
    service_name: string;
    service_code: string;
    total_price: number;
  }>;
}

export interface StarshipitItem {
  description?: string;
  sku?: string;
  quantity?: number;
  weight?: number;
  value?: number;
}

export interface StarshipitOrder {
  order_number: string;
  reference?: string;
  shipping_method?: string;
  destination: {
    name: string;
    phone?: string;
    street: string;
    suburb?: string;
    city?: string;
    state?: string;
    post_code: string;
    country: string;
    delivery_instructions?: string;
  };
  items?: StarshipitItem[];
  packages?: StarshipitPackage[];
  currency?: string;
  signature_required?: boolean;
}

export async function createStarshipitOrder(order: StarshipitOrder) {
  const res = await fetch(`${STARSHIPIT_BASE}/api/orders`, {
    method: "POST",
    headers: starshipitHeaders(),
    body: JSON.stringify({ order }),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Starshipit create order error: ${res.status} ${data?.errors?.map((e: any) => e.message).join(", ") || data?.message || text}`);
  }

  return data;
}

export async function getStarshipitOrder(orderNumber: string) {
  const url = new URL(`${STARSHIPIT_BASE}/api/orders`);
  url.searchParams.set("order_number", orderNumber);
  url.searchParams.set("page_size", "1");
  url.searchParams.set("page_number", "1");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: starshipitHeaders(),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Starshipit get order error: ${res.status} ${data?.errors?.map((e: any) => e.message).join(", ") || data?.message || text}`);
  }

  const orders = Array.isArray(data?.orders) ? data.orders : [];
  if (orders.length === 0) return null;

  return orders.find((o: any) => o.order_number === orderNumber) || orders[0];
}

const DEFAULT_ITEM_WEIGHT_KG = Number(process.env.STARSHIPIT_DEFAULT_ITEM_WEIGHT || 0.1);

export async function pushOrderToStarshipit(
  order: any,
  options?: { defaultItemWeight?: number }
) {
  if (!order?.id) {
    throw new Error("Order id is required");
  }

  if (order.starshipitOrderId) {
    return {
      order: {
        order_id: order.starshipitOrderId,
        order_number: order.starshipitOrderNumber || order.id,
      },
      created: false,
      alreadyExists: true,
    };
  }

  const existing = await getStarshipitOrder(order.id);
  if (existing) {
    return { order: existing, created: false, alreadyExists: true };
  }

  const customer = order.customer || {};
  const shipping = order.shipping || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const defaultWeight = options?.defaultItemWeight ?? DEFAULT_ITEM_WEIGHT_KG;

  const totalWeight = items.reduce((sum: number, item: any) => {
    const weight = Number(item.weight || defaultWeight);
    const qty = Number(item.quantity || 1);
    return sum + weight * qty;
  }, 0);

  const starshipitItems = items.map((item: any) => ({
    description: item.name || item.description,
    sku: item.sku || item.rk_sku || "",
    quantity: Number(item.quantity || 1),
    weight: Number(item.weight || defaultWeight),
    value: Number(item.unitPrice || item.price || 0),
  }));

  const payload: StarshipitOrder = {
    order_number: String(order.id),
    reference: String(order.id),
    shipping_method: shipping.method || "Standard",
    currency: "AUD",
    signature_required: false,
    destination: {
      name: customer.fullName || customer.name || "",
      phone: shipping.phone || customer.phone || "",
      street: shipping.address || "",
      suburb: shipping.city || "",
      city: shipping.city || "",
      state: normalizeStateCode(shipping.state) || "",
      post_code: shipping.zipCode || "",
      country: normalizeCountryName(shipping.country) || "Australia",
      delivery_instructions: shipping.deliveryInstructions || "",
    },
    items: starshipitItems,
    packages: [{ weight: Math.max(totalWeight, 0.01) }],
  };

  const result = await createStarshipitOrder(payload);
  return { order: result?.order, created: true, alreadyExists: false };
}
