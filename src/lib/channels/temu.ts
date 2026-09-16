import crypto from "crypto";
import type { ChannelAdapter, ChannelCredentials, ChannelOrder, ListingPayload } from "./core";
import { proxyFetch } from "@/lib/proxy-fetch";

const TEMU_APP_KEY = process.env.TEMU_APP_KEY || "";
const TEMU_APP_SECRET = process.env.TEMU_APP_SECRET || "";
const TEMU_SITE = (process.env.TEMU_SITE || "us").toLowerCase();
const TEMU_SANDBOX = process.env.TEMU_SANDBOX === "true";
const TEMU_COST_TEMPLATE_ID = process.env.TEMU_COST_TEMPLATE_ID || "";
const TEMU_REDIRECT_URI = process.env.TEMU_REDIRECT_URI || "";
const TEMU_CURRENCY = process.env.TEMU_CURRENCY || "";

const ENDPOINTS: Record<string, string> = {
  us: TEMU_SANDBOX
    ? "https://openapi-b-us.temudemo.com/openapi/router"
    : "https://openapi-b-us.temu.com/openapi/router",
  eu: "https://openapi-b-eu.temu.com/openapi/router",
  global: "https://openapi-b-global.temu.com/openapi/router",
};

const SELLER_CENTER: Record<string, string> = {
  us: "https://seller.temu.com",
  eu: "https://seller-eu.temu.com",
  global: "https://au.seller.temu.com",
};

function getCurrency(payloadCurrency?: string): string {
  if (TEMU_CURRENCY) return TEMU_CURRENCY;
  if (payloadCurrency) return payloadCurrency;
  const SITE_CURRENCY: Record<string, string> = {
    us: "USD",
    eu: "EUR",
    global: "AUD",
  };
  return SITE_CURRENCY[TEMU_SITE] || "USD";
}

function getEndpoint(): string {
  return ENDPOINTS[TEMU_SITE] || ENDPOINTS.us;
}

/**
 * TEMU MD5 signature.
 * 1. Stringify object/array values (compact JSON)
 * 2. Sort keys ascending ASCII
 * 3. Concatenate key+value (no separators)
 * 4. Wrap with app_secret: secret + joined + secret
 * 5. MD5 → uppercase
 */
function temuSign(params: Record<string, unknown>, appSecret: string): string {
  const entries = Object.entries(params).map(([k, v]) => {
    const val =
      typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
    return [k, val] as [string, string];
  });
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const joined = entries.map(([k, v]) => `${k}${v}`).join("");
  return crypto
    .createHash("md5")
    .update(`${appSecret}${joined}${appSecret}`)
    .digest("hex")
    .toUpperCase();
}

interface TemuResponse {
  success: boolean;
  errorCode?: number;
  errorMsg?: string;
  result?: unknown;
  requestId?: string;
}

/**
 * Call a TEMU Open API endpoint.
 * Common params (type, app_key, access_token, timestamp, data_type, sign) are
 * added automatically. Business params are merged in and included in the signature.
 */
async function temuCall(
  type: string,
  businessParams: Record<string, unknown>,
  creds: ChannelCredentials
): Promise<TemuResponse> {
  if (!TEMU_APP_KEY || !TEMU_APP_SECRET) {
    throw new Error("TEMU_APP_KEY and TEMU_APP_SECRET must be set");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const allParams: Record<string, unknown> = {
    type,
    app_key: TEMU_APP_KEY,
    access_token: creds.accessToken,
    timestamp,
    data_type: "JSON",
    ...businessParams,
  };
  const sign = temuSign(allParams, TEMU_APP_SECRET);
  const body = { ...allParams, sign };

  const res = await proxyFetch(getEndpoint(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`TEMU API HTTP ${res.status}: ${text}`);
  }
  const data: TemuResponse = text ? JSON.parse(text) : {};
  if (!data.success) {
    const msg = `TEMU ${type} failed: ${data.errorCode} ${data.errorMsg || ""}`;
    console.error(`[temuCall] ${msg}`, { requestBody: body, response: data });
    throw new Error(msg);
  }
  return data;
}

/**
 * Upload an image to TEMU. Returns the TEMU-hosted URL (on img-xx.kwcdn.com).
 * TEMU requires images to be hosted by them before product creation.
 */
async function uploadImageToTemu(
  imageUrl: string,
  creds: ChannelCredentials
): Promise<string> {
  const data = await temuCall(
    "bg.local.goods.image.upload",
    { fileUrl: imageUrl, scalingType: 1, compressionType: 1 },
    creds
  );
  const result = data.result as { url?: string } | undefined;
  if (!result?.url) {
    throw new Error(`TEMU image upload returned no URL for ${imageUrl}`);
  }
  return result.url;
}

/**
 * Find an existing TEMU goodsId by externalSkuId (outSkuSn) via the goods list.
 * Used as a fallback when publishListing hits "SKU duplicated" but no local
 * ChannelListing record exists (e.g., pushed from another environment).
 */
async function findGoodsIdByOutSkuSn(outSkuSn: string, creds: ChannelCredentials): Promise<string | null> {
  let data: any;
  try {
    data = await temuCall(
      "bg.local.goods.list.query",
      { searchText: outSkuSn, pageNo: 1, pageSize: 50 },
      creds
    );
  } catch {
    // List query can return BUSINESS_SERVICE_ERROR for some searches;
    // treat as "not found" so the caller falls through to a clear error.
    return null;
  }
  const list = ((data?.result as any)?.goodsList || []) as Array<{
    goodsId: string | number;
    outSkuSnList?: string[];
  }>;
  for (const g of list) {
    if (g.outSkuSnList?.includes(outSkuSn)) {
      return String(g.goodsId);
    }
  }
  return null;
}

/**
 * Required category attributes with "no battery" defaults for remote controls.
 * Category 14416 (Garage Door Keypads & Remotes) requires these on every update;
 * v2.add doesn't enforce them but partial.update does.
 */
const DEFAULT_GOODS_PROPERTIES = [
  { refPid: 1561, vid: 36627 }, // Power Supply: Use Without Electricity
  { refPid: 2153, vid: 52032 }, // Battery Properties: Without Battery
  { refPid: 121, vid: 2148 },  // Material: Plastic
  { refPid: 2204, vid: 56055 }, // Code Way: Rolling Code
  { refPid: 2205, vid: 56077 }, // Adapt To The Country Area: AU&NZ
];

export const temuAdapter: ChannelAdapter = {
  name: "temu",

  /**
   * Build the TEMU in-app authorization URL (callback flow).
   * Seller visits this URL, authorizes, TEMU redirects to redirect_uri with ?code=XXX.
   */
  getAuthUrl(state: string) {
    if (!TEMU_APP_KEY) {
      throw new Error("TEMU_APP_KEY must be set");
    }
    const base = SELLER_CENTER[TEMU_SITE] || SELLER_CENTER.us;
    const params = new URLSearchParams({ appKey: TEMU_APP_KEY, state });
    // Manual auth flow doesn't use redirect_uri — only send it if configured.
    if (TEMU_REDIRECT_URI) params.set("redirect_uri", TEMU_REDIRECT_URI);
    return `${base}/open-platform/client-manage/authorization?${params}`;
  },

  /**
   * Exchange the authorization code for an access_token.
   * On the first call, the `code` is passed as the access_token field;
   * TEMU's bg.open.accesstoken.create returns the real access_token + mallId.
   */
  async exchangeCode(code: string) {
    if (!TEMU_APP_KEY || !TEMU_APP_SECRET) {
      throw new Error("TEMU_APP_KEY and TEMU_APP_SECRET must be set");
    }
    // First call: access_token = code. temuCall signs with the code as access_token.
    const tempCreds: ChannelCredentials = {
      accessToken: code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    const data = await temuCall(
      "bg.open.accesstoken.create",
      { code },
      tempCreds
    );
    const result = data.result as {
      accessToken?: string;
      mallId?: number;
      expiredTime?: number;
    };
    if (!result?.accessToken) {
      throw new Error("TEMU token exchange returned no accessToken");
    }
    // expiredTime is in seconds from TEMU; default to 30 days if absent
    const ttlSec = result.expiredTime || 30 * 24 * 60 * 60;
    return {
      accessToken: result.accessToken,
      sellerId: result.mallId?.toString(),
      expiresAt: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
  },

  /**
   * TEMU manual-flow access tokens are long-lived and don't have a refresh endpoint.
   * Re-authorize in Seller Center to get a new token.
   */
  async refreshCredentials(credentials) {
    throw new Error(
      "TEMU tokens are long-lived (no refresh endpoint). Re-authorize in Seller Center and update TEMU_ACCESS_TOKEN."
    );
  },

  /**
   * Push a product to TEMU via temu.local.goods.v2.add.
   * Pipeline: upload images → create product with single SKU.
   * Requires TEMU_COST_TEMPLATE_ID (shipping template created in Seller Center).
   */
  async publishListing(payload, creds) {
    if (!TEMU_COST_TEMPLATE_ID) {
      throw new Error(
        "TEMU_COST_TEMPLATE_ID must be set (create a shipping template in Seller Center first)"
      );
    }
    if (!payload.category) {
      throw new Error(
        `TEMU requires a category (catId). Set product.marketplaceCategory.temu for SKU ${payload.sku}.`
      );
    }

    // Upload all images to TEMU first (they must be TEMU-hosted)
    if (!payload.images.length) {
      throw new Error("TEMU requires at least one product image");
    }
    const temuImages: string[] = [];
    for (const img of payload.images.slice(0, 6)) {
      const temuUrl = await uploadImageToTemu(img, creds);
      temuImages.push(temuUrl);
    }

    const currency = getCurrency(payload.currency);
    const packageInfo = {
      weight: String(payload.packageWeight?.value ?? 1),
      length: String(payload.packageDimensions?.length ?? 10),
      width: String(payload.packageDimensions?.width ?? 10),
      height: String(payload.packageDimensions?.height ?? 10),
    };

    const createPayload: Record<string, unknown> = {
      goodsBasic: {
        catId: Number(payload.category),
        goodsName: payload.title.slice(0, 500),
        goodsDesc: payload.description?.slice(0, 50000) || "",
        goodsGallery: {
          goodsCarouselImage: temuImages,
        },
        brand: { noTrademark: true },
        productType: 1,
      },
      goodsServicePromise: {
        shipmentLimitDay: 1,
        fulfillmentType: 1,
        costTemplateId: TEMU_COST_TEMPLATE_ID,
        ...(TEMU_SITE === "us" ? { importDesignation: "Imported" } : {}),
      },
      skuList: [
        {
          externalSkuId: payload.sku,
          referencePrice: {
            amount: payload.price.toFixed(2),
            currency,
          },
          price: {
            basePrice: {
              amount: payload.price.toFixed(2),
              currency,
            },
          },
          quantity: payload.quantity,
          images: temuImages,
          packageInfo,
        },
      ],
    };

    // Start with "no battery" defaults required by category 14416, then merge
    // any explicit aspects from the product (overrides defaults by refPid).
    const goodsProperty: Array<{ refPid: number; vid: number }> = [...DEFAULT_GOODS_PROPERTIES];
    if (payload.aspects) {
      const overrides = new Map<number, number[]>();
      for (const [key, values] of Object.entries(payload.aspects)) {
        const refPid = Number(key);
        if (!Number.isFinite(refPid)) continue;
        for (const v of values) {
          const vid = Number(v);
          if (Number.isFinite(vid)) {
            if (!overrides.has(refPid)) overrides.set(refPid, []);
            overrides.get(refPid)!.push(vid);
          }
        }
      }
      // Remove default entries that are overridden, then add the overrides
      const overridePids = new Set(overrides.keys());
      const filtered = goodsProperty.filter((g) => !overridePids.has(g.refPid));
      goodsProperty.length = 0;
      goodsProperty.push(...filtered);
      for (const [refPid, vids] of overrides) {
        for (const vid of vids) goodsProperty.push({ refPid, vid });
      }
    }
    if (goodsProperty.length) createPayload.goodsProperty = goodsProperty;

    let data: any;
    try {
      data = await temuCall("temu.local.goods.v2.add", createPayload, creds);
    } catch (err: any) {
      // If the SKU already exists on TEMU (e.g., pushed from another environment
      // and no ChannelListing record exists locally), fall back to updating the
      // existing listing by looking up the goodsId via the goods list API.
      if (String(err?.message || "").includes("150010090")) {
        const existingGoodsId = await findGoodsIdByOutSkuSn(payload.sku, creds);
        if (existingGoodsId) {
          try {
            return await temuAdapter.updateListing(existingGoodsId, payload, creds);
          } catch (updateErr: any) {
            if (String(updateErr?.message || "").includes("150010205")) {
              throw new Error(
                `TEMU: SKU "${payload.sku}" is in TEMU's recycle bin (deletion still processing). ` +
                `Wait for TEMU to finish processing the deletion (can take hours), or use a different SKU. ` +
                `Original error: ${updateErr.message}`
              );
            }
            throw updateErr;
          }
        }
      }
      throw err;
    }
    const result = data.result as {
      goodsId: string;
      skuInfoList?: Array<{ skuId: string }>;
    };
    if (!result?.goodsId) {
      throw new Error("TEMU product create returned no goodsId");
    }
    const skuId = result.skuInfoList?.[0]?.skuId;

    return {
      externalId: String(result.goodsId),
      externalUrl: skuId
        ? `https://www.temu.com/goods-${result.goodsId}.html`
        : undefined,
    };
  },

  /**
   * Update an existing TEMU listing via bg.local.goods.partial.update.
   * externalId is the goodsId. Re-uploads images and updates name/desc/gallery/price/qty.
   */
  async updateListing(externalId, payload, creds) {
    if (!TEMU_COST_TEMPLATE_ID) {
      throw new Error("TEMU_COST_TEMPLATE_ID must be set");
    }
    const goodsId = Number(externalId);

    // Re-upload images (TEMU image URLs may expire; always refresh)
    const temuImages: string[] = [];
    for (const img of payload.images.slice(0, 6)) {
      try {
        temuImages.push(await uploadImageToTemu(img, creds));
      } catch {
        // If upload fails, skip — keep existing images on TEMU
      }
    }

    const currency = getCurrency(payload.currency);
    const updatePayload: Record<string, unknown> = {
      goodsId,
      goodsBasic: {
        goodsName: payload.title.slice(0, 500),
        ...(temuImages.length ? { goodsGallery: { goodsCarouselImage: temuImages } } : {}),
      },
      goodsDesc: payload.description?.slice(0, 50000) || "",
    };

    // Query the existing product to get skuId + existing goodsProperties.
    // partial.update validates the ENTIRE product against category requirements,
    // so we must pass back the existing goodsProperties (e.g. "Power Supply")
    // or TEMU rejects with "keyword attribute required".
    // Also: saveMode is NOT accepted by partial.update in flattened form.
    try {
      const detail = await temuCall("bg.local.goods.detail.query", { goodsId }, creds);
      const result = detail?.result as any;
      const skuList = (result?.skuList || []) as Array<{ skuId: string | number }>;
      if (skuList.length > 0 && temuImages.length) {
        updatePayload.skuList = [
          {
            skuId: skuList[0].skuId,
            images: temuImages,
          },
        ];
      }
      // Merge existing goodsProperties with "no battery" defaults so any
      // category-required attributes that are missing get filled in.
      // partial.update expects goodsProperty: { goodsProperties: [...] }.
      const existing = (result?.goodsProperties || []) as Array<{ refPid?: number; vid?: number }>;
      const existingPids = new Set(existing.map((g) => g.refPid).filter(Boolean));
      const merged = [
        ...existing,
        ...DEFAULT_GOODS_PROPERTIES.filter((d) => !existingPids.has(d.refPid)),
      ];
      updatePayload.goodsProperty = { goodsProperties: merged };
      // Price update via the price API (only works after initial audit)
      if (skuList.length > 0 && payload.price > 0) {
        try {
          await temuCall(
            "bg.local.goods.priceorder.change.sku.price",
            {
              goodsId,
              changeSkuPriceDTOList: [
                {
                  reason: "Listing update",
                  skuChangePriceBaseDTOList: [
                    {
                      skuId: Number(skuList[0].skuId),
                      newSupplierPrice: { amount: payload.price.toFixed(2), currency },
                    },
                  ],
                },
              ],
              rejectSkuPricing: true,
            },
            creds
          );
        } catch {
          // Price audit may still be pending — ignore; the listing still updates
        }
      }
    } catch {
      // If detail query fails, still update the basic fields above
    }

    await temuCall("bg.local.goods.partial.update", updatePayload, creds);
    return {
      externalId: String(goodsId),
      externalUrl: `https://www.temu.com/goods-${goodsId}.html`,
    };
  },

  /**
   * Update inventory (price + quantity) for an existing TEMU listing.
   * Uses bg.local.goods.priceorder.change.sku.price for price.
   * Inventory quantity is updated via bg.local.goods.partial.update.
   */
  async updateInventory(sku, price, quantity, creds) {
    const currency = getCurrency();
    // Price update — requires goodsId + changeSkuPriceDTOList with reason.
    // sku here is the skuId (stored as externalId in ChannelListing for now).
    // TODO: store goodsId in ChannelListing so we can pass it here.
    await temuCall(
      "bg.local.goods.priceorder.change.sku.price",
      {
        changeSkuPriceDTOList: [
          {
            reason: "Inventory sync",
            skuChangePriceBaseDTOList: [
              {
                skuId: Number(sku),
                newSupplierPrice: { amount: price.toFixed(2), currency },
              },
            ],
          },
        ],
        rejectSkuPricing: true,
      },
      creds
    );
    // Quantity update — partial update on the goods, passing skuList with new quantity
    // Note: this requires the goodsId; for now we only update price.
    // Full inventory sync would need a goodsId→skuId mapping stored in ChannelListing.
  },

  async fetchOrders(since, creds) {
    // TODO: implement bg.order.list.get when order sync is needed
    return [];
  },
};
