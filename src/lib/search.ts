// Shared client-side product search: tokenised AND matching, field-weighted
// ranking, and 1-edit typo tolerance on high-signal fields (name/brand/SKU/
// model/compatibility). Used by the header instant search and the
// /products listing filter so both behave identically.

const PRIMARY_FIELDS = ["name", "brand", "sku", "rk_sku", "model", "compatibility"];
const EXTRA_FIELDS = ["description", "category", "id", "seo_title", "tags", "features", "cat1", "cat2"];

export type SearchEntry<T = any> = {
  product: T;
  primary: string;
  haystack: string;
  primaryTokens: string[];
};

export function buildProductSearchIndex<T extends Record<string, any>>(products: T[]): SearchEntry<T>[] {
  return (products || []).map((product) => {
    const primary = PRIMARY_FIELDS.map((f) => product[f]).filter(Boolean).join(" ").toLowerCase();
    const extra = EXTRA_FIELDS.map((f) => product[f]).filter(Boolean).join(" ").toLowerCase();
    return {
      product,
      primary,
      haystack: `${primary} ${extra}`,
      primaryTokens: Array.from(new Set(primary.split(/[^a-z0-9]+/).filter((t) => t.length > 1))),
    };
  });
}

// Bounded Levenshtein — returns maxDist + 1 as soon as it exceeds the cap.
function editDistance(a: string, b: string, maxDist: number): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > maxDist) return maxDist + 1;
    prev = cur;
  }
  return prev[b.length];
}

// 2 = exact substring hit, 1 = fuzzy hit on a primary token, 0 = miss.
function tokenMatchScore(token: string, entry: SearchEntry): 0 | 1 | 2 {
  if (entry.haystack.includes(token)) return 2;
  if (token.length >= 4) {
    for (const t of entry.primaryTokens) {
      if (Math.abs(t.length - token.length) <= 1 && editDistance(token, t, 1) <= 1) return 1;
    }
  }
  return 0;
}

export function searchIndex<T = any>(
  entries: SearchEntry<T>[],
  query: string,
): { product: T; score: number }[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored: { product: T; score: number }[] = [];

  for (const e of entries) {
    let score = 0;
    let failed = false;
    for (const t of tokens) {
      const m = tokenMatchScore(t, e);
      if (m === 0) { failed = true; break; }
      score += m === 2 ? 10 : 3;
      if (e.primary.includes(t)) score += 10;
      const p: any = e.product;
      const name = String(p.name || "").toLowerCase();
      if (name.startsWith(t)) score += 5;
      for (const f of ["sku", "rk_sku", "model"]) {
        if (t === String(p[f] || "").toLowerCase()) { score += 40; break; }
      }
    }
    if (!failed) scored.push({ product: e.product, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
