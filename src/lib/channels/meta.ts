// Meta (Facebook/Instagram) Catalog Batch API — push product creates,
// updates and deletes straight into a Commerce catalog.
// https://developers.facebook.com/documentation/ads-commerce/catalog/guides/manage-catalog-items/catalog-batch-api

const META_API_VERSION = process.env.META_API_VERSION || "v21.0";
const GRAPH = "https://graph.facebook.com";

export interface MetaCatalogCreds {
  catalogId: string;
  accessToken: string;
}

export function getMetaCatalogCreds(): MetaCatalogCreds {
  const catalogId = process.env.META_CATALOG_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!catalogId || !accessToken) {
    throw new Error("META_CATALOG_ID and META_ACCESS_TOKEN must be set (see scripts/meta-push.ts docs)");
  }
  return { catalogId, accessToken };
}

// Graph API expects form-encoded params — a JSON body silently drops the
// `requests` field and every item validates as an empty (duplicate) id.
async function metaPost(path: string, params: Record<string, unknown>, accessToken: string) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    form.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  form.set("access_token", accessToken);
  const res = await fetch(`${GRAPH}/${META_API_VERSION}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    throw new Error(`Meta ${path} failed: ${e.code ?? res.status} ${e.message || JSON.stringify(data)}`);
  }
  return data;
}

// Up to 5000 records per call; UPDATE upserts by retailer_id (allow_upsert
// defaults true) so a single method covers create + update.
export async function metaItemsBatch(requests: any[], creds: MetaCatalogCreds) {
  return metaPost(`/${creds.catalogId}/items_batch`, {
    item_type: "PRODUCT_ITEM",
    requests,
  }, creds.accessToken);
}

// Product sets = catalog "categories" shown as collections in the shop.
// Filter syntax: {"product_type":{"i_contains":"Garage & Gate"}}.
export async function metaGetProductSets(creds: MetaCatalogCreds) {
  const url = `${GRAPH}/${META_API_VERSION}/${creds.catalogId}/product_sets?access_token=${encodeURIComponent(creds.accessToken)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    throw new Error(`Meta product_sets failed: ${e.code ?? res.status} ${e.message || ""}`);
  }
  return data.data || [];
}

export async function metaCreateProductSet(name: string, productType: string, creds: MetaCatalogCreds) {
  return metaPost(`/${creds.catalogId}/product_sets`, {
    name,
    filter: { product_type: { i_contains: productType } },
  }, creds.accessToken);
}

// Poll a batch handle until Meta finishes ingesting it.
export async function metaCheckBatch(handle: string, creds: MetaCatalogCreds) {
  return metaGet(`/${creds.catalogId}/check_batch_request_status`, { handle }, creds.accessToken);
}

// Generic GET — returns { data, paging } or throws on Meta errors.
export async function metaGet(path: string, params: Record<string, unknown>, accessToken: string) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    q.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  q.set("access_token", accessToken);
  const res = await fetch(`${GRAPH}/${META_API_VERSION}${path}?${q.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    throw new Error(`Meta ${path} failed: ${e.code ?? res.status} ${e.message || JSON.stringify(data)}`);
  }
  return data;
}

export function getMetaAdAccountId() {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id) throw new Error("META_AD_ACCOUNT_ID must be set (numeric ID from Ads Manager URL)");
  return `act_${String(id).replace(/^act_/, "")}`;
}

// Ads insights: spend/impressions/clicks per campaign (or account/adset/ad level).
export async function metaAdInsights(level: "account" | "campaign" | "adset" | "ad", datePreset: string) {
  const { accessToken } = getMetaCatalogCreds();
  return metaGet(`/${getMetaAdAccountId()}/insights`, {
    fields: "spend,impressions,reach,clicks,ctr,cpc,actions,cost_per_action_type,campaign_name,adset_name,ad_name",
    level,
    date_preset: datePreset,
    limit: 100,
  }, accessToken);
}

// ── Organic publishing (Facebook Page + linked Instagram business account) ──

export function getMetaPageId() {
  return process.env.META_PAGE_ID || "1282105401659900"; // "All Remotes" page
}

// Posting to a Page requires a Page-scoped token — the system-user token
// can mint one because the page is assigned to it in Business Manager.
async function getPageAccessToken() {
  const { accessToken } = getMetaCatalogCreds();
  const page = await metaGet(`/${getMetaPageId()}`, { fields: "access_token" }, accessToken);
  if (!page?.access_token) {
    throw new Error("No Page access token — assign the system user to the Page in Business Settings and grant pages_manage_posts");
  }
  return page.access_token as string;
}

export async function getInstagramBusinessId() {
  const { accessToken } = getMetaCatalogCreds();
  const page = await metaGet(`/${getMetaPageId()}`, { fields: "instagram_business_account" }, accessToken);
  return page?.instagram_business_account?.id as string | undefined;
}

export async function postToFacebook(opts: { message: string; link?: string; imageUrl?: string }) {
  const pageToken = await getPageAccessToken();
  const pageId = getMetaPageId();
  if (opts.imageUrl) {
    return metaPost(`/${pageId}/photos`, {
      url: opts.imageUrl,
      caption: opts.message,
      ...(opts.link ? { link: opts.link } : {}),
    }, pageToken);
  }
  return metaPost(`/${pageId}/feed`, {
    message: opts.message,
    ...(opts.link ? { link: opts.link } : {}),
  }, pageToken);
}

// IG publishing is two-step: create a media container from a public image
// URL, wait for processing, then publish it. Text-only posts are not
// possible — every IG post needs an image or video.
export async function postToInstagram(opts: { imageUrl: string; caption: string }) {
  const { accessToken } = getMetaCatalogCreds();
  const igId = await getInstagramBusinessId();
  if (!igId) throw new Error("No Instagram business account linked to the Page");
  const container = await metaPost(`/${igId}/media`, { image_url: opts.imageUrl, caption: opts.caption }, accessToken);
  if (!container?.id) throw new Error("Instagram media container creation failed");
  for (let i = 0; i < 15; i++) {
    const status = await metaGet(`/${container.id}`, { fields: "status_code" }, accessToken).catch(() => null);
    if (status?.status_code === "FINISHED") {
      return metaPost(`/${igId}/media_publish`, { creation_id: container.id }, accessToken);
    }
    if (status?.status_code === "ERROR") throw new Error("Instagram media processing failed (check the image URL is public HTTPS)");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Instagram media processing timed out");
}
