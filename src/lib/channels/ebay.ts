import type { ChannelAdapter, ChannelCredentials, ChannelOrder, ListingPayload } from "./core";

const EBAY_AUTH_URL = process.env.EBAY_AUTH_URL || "https://auth.ebay.com/oauth2/authorize";
const EBAY_API_URL = process.env.EBAY_API_URL || "https://api.ebay.com";
const EBAY_APP_ID = process.env.EBAY_APP_ID || "";
const EBAY_CERT_ID = process.env.EBAY_CERT_ID || "";
const EBAY_REDIRECT_URI = process.env.EBAY_REDIRECT_URI || "";
const EBAY_MARKETPLACE_ID = process.env.EBAY_MARKETPLACE_ID || "EBAY_AU";
const EBAY_FULFILLMENT_POLICY_ID = process.env.EBAY_FULFILLMENT_POLICY_ID || "";
const EBAY_PAYMENT_POLICY_ID = process.env.EBAY_PAYMENT_POLICY_ID || "";
const EBAY_RETURN_POLICY_ID = process.env.EBAY_RETURN_POLICY_ID || "";
const EBAY_MERCHANT_LOCATION_KEY = process.env.EBAY_MERCHANT_LOCATION_KEY || "";

const SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
];

function getAuthHeader() {
  const creds = `${EBAY_APP_ID}:${EBAY_CERT_ID}`;
  return "Basic " + Buffer.from(creds).toString("base64");
}

function mapCondition(condition = ""): string {
  const c = condition.toLowerCase();
  if (c.includes("new")) return "NEW";
  if (c.includes("used")) return "USED";
  if (c.includes("refurb")) return "SELLER_REFURBISHED";
  return "NEW";
}

async function ebayFetch(path: string, options: RequestInit & { accessToken: string }) {
  const { accessToken, ...rest } = options;
  const res = await fetch(`${EBAY_API_URL}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(rest.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

export const eBayAdapter: ChannelAdapter = {
  name: "ebay",

  getAuthUrl(state: string) {
    if (!EBAY_APP_ID || !EBAY_REDIRECT_URI) {
      throw new Error("EBAY_APP_ID and EBAY_REDIRECT_URI must be set");
    }
    const query = Object.entries({
      client_id: EBAY_APP_ID,
      response_type: "code",
      redirect_uri: EBAY_REDIRECT_URI,
      scope: SCOPES.join(" "),
      state,
    })
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return `${EBAY_AUTH_URL}?${query}`;
  },

  async exchangeCode(code: string) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: EBAY_REDIRECT_URI,
    });
    const res = await fetch(`${EBAY_API_URL}/identity/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) throw new Error(`eBay token exchange failed: ${await res.text()}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000).toISOString(),
      scopes: data.scope ? data.scope.split(" ") : SCOPES,
    };
  },

  async refreshCredentials(credentials) {
    if (!credentials.refreshToken) throw new Error("No refresh token available");
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
      scope: SCOPES.join(" "),
    }).toString().replace(/\+/g, "%20");
    const res = await fetch(`${EBAY_API_URL}/identity/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) throw new Error(`eBay refresh failed: ${await res.text()}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || credentials.refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000).toISOString(),
      scopes: data.scope ? data.scope.split(" ") : credentials.scopes,
    };
  },

  async publishListing(payload, creds) {
    if (!EBAY_FULFILLMENT_POLICY_ID || !EBAY_PAYMENT_POLICY_ID || !EBAY_RETURN_POLICY_ID || !EBAY_MERCHANT_LOCATION_KEY) {
      throw new Error(
        "eBay business policy IDs and merchant location key must be configured in environment variables."
      );
    }

    const title = payload.title.slice(0, 80);

    if (!payload.category || payload.category === "0") {
      throw new Error("eBay categoryId is required. Set product.marketplaceCategory.ebay to a valid eBay category ID.");
    }

    const inventoryItem: any = {
      sku: payload.sku,
      locale: "en_AU",
      product: {
        title,
        description: payload.description,
        imageUrls: payload.images,
        aspects: {
          Brand: [payload.brand],
        },
      },
      condition: mapCondition(payload.condition),
      availability: {
        shipToLocationAvailability: {
          quantity: payload.quantity,
        },
      },
    };

    if (payload.mpn) inventoryItem.product.aspects.MPN = [payload.mpn];
    if (payload.gtin) inventoryItem.product.aspects.GTIN = [payload.gtin];
    if (payload.packageWeight) {
      inventoryItem.packageWeightAndSize = {
        weight: { value: payload.packageWeight.value, unit: payload.packageWeight.unit },
      };
      if (payload.packageDimensions) {
        inventoryItem.packageWeightAndSize.dimensions = {
          length: payload.packageDimensions.length,
          width: payload.packageDimensions.width,
          height: payload.packageDimensions.height,
          unit: payload.packageDimensions.unit,
        };
      }
    }

    await ebayFetch(`/sell/inventory/v1/inventory_item/${encodeURIComponent(payload.sku)}`, {
      method: "PUT",
      accessToken: creds.accessToken,
      body: JSON.stringify(inventoryItem),
      headers: { "Content-Language": "en-AU", "Accept-Language": "en-AU" },
    });

    const offerPayload = {
      sku: payload.sku,
      marketplaceId: EBAY_MARKETPLACE_ID,
      format: "FIXED_PRICE",
      availableQuantity: payload.quantity,
      categoryId: payload.category || "0",
      listingDescription: payload.description,
      pricingSummary: {
        price: { currency: payload.currency, value: payload.price.toFixed(2) },
      },
      listingPolicies: {
        fulfillmentPolicyId: EBAY_FULFILLMENT_POLICY_ID,
        paymentPolicyId: EBAY_PAYMENT_POLICY_ID,
        returnPolicyId: EBAY_RETURN_POLICY_ID,
      },
      merchantLocationKey: EBAY_MERCHANT_LOCATION_KEY,
    };

    const offerRes: any = await ebayFetch("/sell/inventory/v1/offer", {
      method: "POST",
      accessToken: creds.accessToken,
      body: JSON.stringify(offerPayload),
      headers: { "Content-Language": "en-AU", "Accept-Language": "en-AU" },
    });
    const offerId = offerRes?.offerId;
    if (!offerId) throw new Error("eBay did not return an offerId");

    const publishRes: any = await ebayFetch(`/sell/inventory/v1/offer/${offerId}/publish`, {
      method: "POST",
      accessToken: creds.accessToken,
    });

    return {
      externalId: offerId,
      externalUrl: publishRes?.listingId ? `https://www.ebay.com.au/itm/${publishRes.listingId}` : undefined,
    };
  },

  async updateListing(offerId: string, payload: ListingPayload, creds: ChannelCredentials) {
    const title = payload.title.slice(0, 80);

    if (!payload.category || payload.category === "0") {
      throw new Error("eBay categoryId is required. Set product.marketplaceCategory.ebay to a valid eBay category ID.");
    }

    const inventoryItem: any = {
      sku: payload.sku,
      locale: "en_AU",
      product: {
        title,
        description: payload.description,
        imageUrls: payload.images,
        aspects: { Brand: [payload.brand] },
      },
      condition: mapCondition(payload.condition),
      availability: {
        shipToLocationAvailability: { quantity: payload.quantity },
      },
    };

    if (payload.mpn) inventoryItem.product.aspects.MPN = [payload.mpn];
    if (payload.gtin) inventoryItem.product.aspects.GTIN = [payload.gtin];
    if (payload.packageWeight) {
      inventoryItem.packageWeightAndSize = {
        weight: { value: payload.packageWeight.value, unit: payload.packageWeight.unit },
      };
      if (payload.packageDimensions) {
        inventoryItem.packageWeightAndSize.dimensions = {
          length: payload.packageDimensions.length,
          width: payload.packageDimensions.width,
          height: payload.packageDimensions.height,
          unit: payload.packageDimensions.unit,
        };
      }
    }

    await ebayFetch(`/sell/inventory/v1/inventory_item/${encodeURIComponent(payload.sku)}`, {
      method: "PUT",
      accessToken: creds.accessToken,
      body: JSON.stringify(inventoryItem),
      headers: { "Content-Language": "en-AU", "Accept-Language": "en-AU" },
    });

    const offerPayload = {
      sku: payload.sku,
      marketplaceId: EBAY_MARKETPLACE_ID,
      format: "FIXED_PRICE",
      availableQuantity: payload.quantity,
      categoryId: payload.category || "0",
      listingDescription: payload.description,
      pricingSummary: {
        price: { currency: payload.currency, value: payload.price.toFixed(2) },
      },
      listingPolicies: {
        fulfillmentPolicyId: EBAY_FULFILLMENT_POLICY_ID,
        paymentPolicyId: EBAY_PAYMENT_POLICY_ID,
        returnPolicyId: EBAY_RETURN_POLICY_ID,
      },
      merchantLocationKey: EBAY_MERCHANT_LOCATION_KEY,
    };

    await ebayFetch(`/sell/inventory/v1/offer/${offerId}`, {
      method: "PUT",
      accessToken: creds.accessToken,
      body: JSON.stringify(offerPayload),
      headers: { "Content-Language": "en-AU", "Accept-Language": "en-AU" },
    });

    return { externalId: offerId };
  },

  async updateInventory(sku, price, quantity, creds) {
    const payload = {
      requests: [
        {
          sku,
          price: { currency: process.env.DEFAULT_CURRENCY || "AUD", value: price.toFixed(2) },
          availability: { shipToLocationAvailability: { quantity } },
        },
      ],
    };
    await ebayFetch("/sell/inventory/v1/bulk_update_price_quantity", {
      method: "POST",
      accessToken: creds.accessToken,
      body: JSON.stringify(payload),
    });
  },

  async fetchOrders(since, creds) {
    const start = since.toISOString();
    const end = new Date().toISOString();
    const filter = `creationdate:[${start}..${end}]`;
    const res: any = await ebayFetch(
      `/sell/fulfillment/v1/order?filter=${encodeURIComponent(filter)}&limit=50`,
      { method: "GET", accessToken: creds.accessToken }
    );

    const orders = res?.orders || [];
    return orders.map((order: any): ChannelOrder => {
      const buyer = order.buyer || {};
      const shipping = order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo || {};
      return {
        orderId: order.orderId,
        channel: "ebay",
        externalOrderId: order.orderId,
        externalStatus: order.orderFulfillmentStatus?.status || "UNKNOWN",
        status: mapEbayOrderStatus(order.orderFulfillmentStatus?.status),
        createdAt: order.creationDate,
        updatedAt: order.lastModifiedDate || order.creationDate,
        customer: {
          fullName: shipping.fullName || buyer.username || "eBay buyer",
          email: buyer.email || undefined,
        },
        shipping: {
          address: shipping.contactAddress?.addressLine1 || "",
          city: shipping.contactAddress?.city || "",
          state: shipping.contactAddress?.stateOrProvince || "",
          zipCode: shipping.contactAddress?.postalCode || "",
          country: shipping.contactAddress?.countryCode,
        },
        items: (order.lineItems || []).map((line: any) => ({
          sku: line.sku,
          name: line.title,
          quantity: line.quantity,
          unitPrice: Number(line.lineItemCost?.value || 0) / (line.quantity || 1),
          lineTotal: Number(line.lineItemCost?.value || 0),
        })),
        pricing: {
          currency: order.pricingSummary?.total?.currency || "AUD",
          subtotal: Number(order.pricingSummary?.subtotal?.value || 0),
          total: Number(order.pricingSummary?.total?.value || 0),
        },
      };
    });
  },
};

export async function createEbayInventoryLocation(
  {
    city,
    state,
    postcode,
    country = "AU",
  }: {
    city: string;
    state: string;
    postcode: string;
    country?: string;
  },
  accessToken: string
) {
  const body = {
    location: {
      address: {
        city,
        stateOrProvince: state,
        postalCode: postcode,
        country,
      },
    },
    locationTypes: ["WAREHOUSE"],
    merchantLocationStatus: "ENABLED",
  };

  await ebayFetch(`/sell/inventory/v1/location/${encodeURIComponent(EBAY_MERCHANT_LOCATION_KEY)}`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(body),
    headers: { "Content-Language": "en-AU", "Accept-Language": "en-AU" },
  });
}

async function getApplicationAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope",
  });
  const res = await fetch(`${EBAY_API_URL}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`eBay app token failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

export async function guessCategory(query: string): Promise<string | null> {
  const appToken = await getApplicationAccessToken();
  const treeRes: any = await ebayFetch(
    `/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${EBAY_MARKETPLACE_ID}`,
    { method: "GET", accessToken: appToken }
  );
  const treeId = treeRes?.categoryTreeId;
  if (!treeId) return null;
  const suggestions: any = await ebayFetch(
    `/commerce/taxonomy/v1/category_tree/${treeId}/get_category_suggestions?q=${encodeURIComponent(query)}`,
    { method: "GET", accessToken: appToken }
  );
  const list = suggestions?.categorySuggestions || [];
  return list[0]?.category?.categoryId || null;
}

function mapEbayOrderStatus(status: string): string {
  if (!status) return "processing";
  const s = status.toLowerCase();
  if (s.includes("pending")) return "processing";
  if (s.includes("shipped")) return "shipped";
  if (s.includes("delivered")) return "delivered";
  if (s.includes("cancel")) return "cancelled";
  return "processing";
}
