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
