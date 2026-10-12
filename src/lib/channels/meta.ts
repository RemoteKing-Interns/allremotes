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

async function metaPost(path: string, body: Record<string, unknown>, accessToken: string) {
  const res = await fetch(`${GRAPH}/${META_API_VERSION}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, access_token: accessToken }),
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

// Poll a batch handle until Meta finishes ingesting it.
export async function metaCheckBatch(handle: string, creds: MetaCatalogCreds) {
  const url = `${GRAPH}/${META_API_VERSION}/${creds.catalogId}/check_batch_request_status?` +
    `handle=${encodeURIComponent(handle)}&access_token=${encodeURIComponent(creds.accessToken)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    throw new Error(`Meta check_batch_request_status failed: ${e.code ?? res.status} ${e.message || ""}`);
  }
  return data;
}
