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

function getMarketplaceLocale(): { locale: string; contentLanguage: string } {
  switch (EBAY_MARKETPLACE_ID) {
    case "EBAY_AU":
      return { locale: "en_AU", contentLanguage: "en-AU" };
    case "EBAY_GB":
      return { locale: "en_GB", contentLanguage: "en-GB" };
    case "EBAY_DE":
      return { locale: "de_DE", contentLanguage: "de-DE" };
    case "EBAY_US":
    default:
      return { locale: "en_US", contentLanguage: "en-US" };
  }
}

function normalizeEbayDescription(description: string | undefined): string {
  const html = String(description || "").trim();
  if (html.length <= 500000) return html;
  return html.slice(0, 499997) + "...";
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
      "Accept-Language": "en-US",
      "Content-Language": "en-US",
      ...(rest.headers || {}),
    },
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) {
    console.error(`[eBayFetch] ${res.status} ${path}`, { responseHeaders: Object.fromEntries(res.headers.entries()), body: text });
    throw new Error(`eBay API error ${res.status}: ${text}`);
  }
  const data = text ? JSON.parse(text) : null;
  if (data?.errors?.length) {
    console.error(`[eBayFetch] ${res.status} ${path}`, { responseHeaders: Object.fromEntries(res.headers.entries()), body: text });
    throw new Error(`eBay API error ${res.status}: ${text}`);
  }
  return data;
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
    const scope = credentials.scopes?.join(" ");
    const params: Record<string, string> = {
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    };
    if (scope) params.scope = scope;
    const body = new URLSearchParams(params).toString().replace(/\+/g, "%20");
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
    const description = normalizeEbayDescription(payload.description);
    const { locale, contentLanguage } = getMarketplaceLocale();

    if (!payload.category || payload.category === "0") {
      throw new Error(`eBay categoryId is required for SKU ${payload.sku} (${payload.title}). Set product.marketplaceCategory.ebay to a valid eBay category ID.`);
    }

    const inventoryItem: any = {
      sku: payload.sku,
      locale,
      product: {
        title,
        description,
        imageUrls: payload.images,
        aspects: payload.aspects || {
          Brand: [payload.brand],
          Type: [payload.type || "Remote Control"],
        },
      },
      condition: mapCondition(payload.condition),
      availability: {
        shipToLocationAvailability: {
          availabilityDistributions: [
            {
              merchantLocationKey: EBAY_MERCHANT_LOCATION_KEY,
              quantity: payload.quantity,
            },
          ],
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
      headers: { "Content-Language": contentLanguage },
    });

    const offerPayload = {
      sku: payload.sku,
      marketplaceId: EBAY_MARKETPLACE_ID,
      format: "FIXED_PRICE",
      availableQuantity: payload.quantity,
      categoryId: payload.category || "0",
      listingDescription: description,
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

    // eBay inventory item may not be immediately queryable; retry offer creation
    let offerId: string | undefined;
    let lastOfferError: any;
    for (let attempt = 0; attempt < 3 && !offerId; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      try {
        const offerRes: any = await ebayFetch("/sell/inventory/v1/offer", {
          method: "POST",
          accessToken: creds.accessToken,
          body: JSON.stringify(offerPayload),
          headers: { "Content-Language": contentLanguage },
        });
        offerId = offerRes?.offerId;
        break;
      } catch (err: any) {
        lastOfferError = err;
        const msg = err?.message || "";
        const isNotFound = msg.includes("could not be found or is not available");
        if (!isNotFound) {
          const bodyText = msg.replace(/^eBay API error \d+:\s*/, "");
          try {
            const data = JSON.parse(bodyText);
            const error = data?.errors?.[0];
            if (error?.errorId === 25002) {
              offerId = error.parameters?.find((p: any) => p.name === "offerId")?.value;
              if (offerId) break;
            }
          } catch {}
          throw err;
        }
      }
    }
    if (!offerId) throw lastOfferError || new Error("eBay did not return an offerId");

    // If offer already existed, update it to pick up latest inventory item aspects
    try {
      await ebayFetch(`/sell/inventory/v1/offer/${offerId}`, {
        method: "PUT",
        accessToken: creds.accessToken,
        body: JSON.stringify(offerPayload),
        headers: { "Content-Language": contentLanguage },
      });
    } catch {}

    let listingId: string | undefined;
    try {
      const publishRes: any = await ebayFetch(`/sell/inventory/v1/offer/${offerId}/publish`, {
        method: "POST",
        accessToken: creds.accessToken,
      });
      listingId = publishRes?.listingId;
    } catch (err: any) {
      const msg = err?.message || "";
      if (!/already\s*(?:been\s*)?published/i.test(msg)) throw err;
      // Already live — try to fetch the listing id so we can return the URL
      const existing: any = await ebayFetch(`/sell/inventory/v1/offer/${offerId}`, {
        method: "GET",
        accessToken: creds.accessToken,
      }).catch(() => null);
      listingId = existing?.listingId;
    }

    return {
      externalId: offerId,
      externalUrl: listingId ? `https://www.ebay.com.au/itm/${listingId}` : undefined,
    };
  },

  async updateListing(offerId: string, payload: ListingPayload, creds: ChannelCredentials) {
    const title = payload.title.slice(0, 80);
    const description = normalizeEbayDescription(payload.description);
    const { locale, contentLanguage } = getMarketplaceLocale();

    if (!payload.category || payload.category === "0") {
      throw new Error(`eBay categoryId is required for SKU ${payload.sku} (${payload.title}). Set product.marketplaceCategory.ebay to a valid eBay category ID.`);
    }

    const inventoryItem: any = {
      sku: payload.sku,
      locale,
      product: {
        title,
        description,
        imageUrls: payload.images,
        aspects: payload.aspects || {
          Brand: [payload.brand],
          Type: [payload.type || "Remote Control"],
        },
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
      headers: { "Content-Language": contentLanguage },
    });

    const offerPayload = {
      sku: payload.sku,
      marketplaceId: EBAY_MARKETPLACE_ID,
      format: "FIXED_PRICE",
      availableQuantity: payload.quantity,
      categoryId: payload.category || "0",
      listingDescription: description,
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
      headers: { "Content-Language": contentLanguage },
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
      const instruction = order.fulfillmentStartInstructions?.[0] || {};
      const shipTo = instruction.shippingStep?.shipTo || {};
      const finalDest = instruction.finalDestinationAddress;
      const registration = buyer.buyerRegistrationAddress || {};

      const isEbayToken = (val: any) =>
        typeof val === "string" && /^ebay:/i.test(val.trim());

      const hasRealStreet = (addr: any) =>
        addr &&
        ((!isEbayToken(addr.addressLine1) && addr.addressLine1) ||
          (!isEbayToken(addr.addressLine2) && addr.addressLine2));

      const addressCandidates = [
        shipTo.contactAddress,
        finalDest,
        registration.contactAddress,
      ].filter(Boolean);
      const addressContact =
        addressCandidates.find((a) => hasRealStreet(a)) || shipTo.contactAddress || finalDest || registration.contactAddress || {};

      const rawLines = [
        addressContact.addressLine1,
        addressContact.addressLine2,
      ].filter((l) => typeof l === "string" && l.trim().length > 0) as string[];
      const cleanLines = rawLines.filter((l) => !isEbayToken(l.trim()));
      const addr1 = cleanLines[0] || "";
      const addr2 = cleanLines[1];

      const phone =
        shipTo.primaryPhone?.phoneNumber ||
        shipTo.primaryPhone?.number ||
        registration.primaryPhone?.phoneNumber ||
        registration.primaryPhone?.number ||
        "";

      const fullName = shipTo.fullName || registration.fullName || buyer.username || "eBay buyer";
      const email = shipTo.email || registration.email || buyer.email || undefined;
      const username = buyer.username || undefined;

      const lineItems = (order.lineItems || []).map((line: any) => ({
        sku: line.sku || line.legacyItemId || "",
        name: line.title || "",
        quantity: Number(line.quantity || 1),
        unitPrice: Number(line.lineItemCost?.value || 0) / (Number(line.quantity) || 1),
        lineTotal: Number(line.lineItemCost?.value || 0),
        externalId: line.itemId || line.legacyItemId || undefined,
        color: line.variationDetails?.["Color"] || line.variationDetails?.["color"] || undefined,
      }));

      const lineSubtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const currency = order.pricingSummary?.total?.currency || order.pricingSummary?.priceSubtotal?.currency || "AUD";
      const subtotal = Number(
        order.pricingSummary?.priceSubtotal?.value ??
        order.pricingSummary?.subtotal?.value ??
        lineSubtotal
      );
      const shippingCost = Number(order.pricingSummary?.deliveryCost?.value || 0);
      const discount = Number(order.pricingSummary?.discount?.value || 0);
      const total = Number(order.pricingSummary?.total?.value ?? lineSubtotal + shippingCost - discount);

      const postageService =
        instruction.shippingStep?.shippingServiceName ||
        instruction.shippingStep?.shippingServiceCode ||
        undefined;

      return {
        orderId: order.orderId,
        channel: "ebay",
        externalOrderId: order.orderId,
        externalStatus: order.orderFulfillmentStatus?.status || "UNKNOWN",
        status: mapEbayOrderStatus(order.orderFulfillmentStatus?.status),
        createdAt: order.creationDate,
        updatedAt: order.lastModifiedDate || order.creationDate,
        customer: {
          fullName,
          email,
          username,
          phone,
        },
        shipping: {
          address: addr1,
          address2: addr2 || undefined,
          city: addressContact.city || "",
          state: addressContact.stateOrProvince || "",
          zipCode: addressContact.postalCode || "",
          country: addressContact.countryCode || addressContact.country,
          phone,
        },
        items: lineItems,
        pricing: {
          currency,
          subtotal,
          total,
          shipping: shippingCost || undefined,
          discountTotal: discount || undefined,
        },
        postageService,
        shippingNote: order.buyerCheckoutNotes || undefined,
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
  const { contentLanguage } = getMarketplaceLocale();
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
    headers: { "Content-Language": contentLanguage },
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

export async function getRequiredAspects(categoryId: string): Promise<Record<string, string[]>> {
  const appToken = await getApplicationAccessToken();
  const treeRes: any = await ebayFetch(
    `/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${EBAY_MARKETPLACE_ID}`,
    { method: "GET", accessToken: appToken }
  );
  const treeId = treeRes?.categoryTreeId;
  console.error(`[getRequiredAspects] categoryId=${categoryId}, treeId=${treeId}, fullTreeRes=`, treeRes);
  if (!treeId) return {};
  const aspects: any = await ebayFetch(
    `/commerce/taxonomy/v1/category_tree/${treeId}/get_item_aspects_for_category?category_id=${categoryId}`,
    { method: "GET", accessToken: appToken }
  );
  const result: Record<string, string[]> = {};
  for (const aspect of aspects?.aspects || []) {
    if (aspect?.aspectConstraint?.aspectRequired) {
      result[aspect.localizedAspectName || aspect.aspectName] = aspect?.aspectValues?.map((v: any) => v.localizedValue || v.value) || [];
    }
  }
  return result;
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
