export function generateSlug(name: string, sku?: string): string {
  const parts: string[] = [];
  if (name) parts.push(name);
  if (sku) parts.push(sku);
  const base = parts.join("-");
  return base
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function generateProductSlugUrl(id: string, name: string, sku?: string): string {
  const slug = generateSlug(name, sku);
  if (!slug) return `/product/${encodeURIComponent(id)}`;
  return `/product/${slug}-${id}`;
}

export function extractIdFromSlugParam(param: string): string {
  const decoded = (() => {
    try { return decodeURIComponent(param); } catch { return param; }
  })();
  const match = decoded.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (match) return match[1];
  return decoded;
}
