// Shared client-side product search backed by an inverted index
// (term -> posting list), built once per product set and reused across
// keystrokes — Elasticsearch-style retrieval in miniature.
//
// Matching is term-level (the catalog is split on non-alphanumerics), with
// tiered expansion per query token: exact term > prefix > infix > 1-edit
// fuzzy. Query tokens AND-intersect, so every token must match. Scoring is
// field-weighted: name > brand/SKU/model/compatibility > description/meta.

const NAME_FIELDS = ["name"];
const CODE_FIELDS = ["brand", "sku", "rk_sku", "model", "compatibility"];
const EXTRA_FIELDS = ["description", "category", "id", "seo_title", "tags", "features", "cat1", "cat2"];

const EXACT_MULT = 1;
const PREFIX_MULT = 0.7;
const INFIX_MULT = 0.4;
const FUZZY_MULT = 0.3;

type Posting = { doc: number; w: number };

export interface ProductSearchIndex<T = any> {
  docs: T[];
  index: Map<string, Posting[]>;
  names: string[];    // lowercase product name per doc
  codes: string[][];  // sku/rk_sku/model values per doc (exact-match bonus)
  primary: string[];  // joined primary-field text per doc (contains-token bonus)
}

const tokenize = (s: string) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);

export function buildProductSearchIndex<T extends Record<string, any>>(products: T[]): ProductSearchIndex<T> {
  const index = new Map<string, Posting[]>();
  const docs = products || [];
  const names: string[] = [];
  const codes: string[][] = [];
  const primary: string[] = [];

  docs.forEach((product, doc) => {
    names.push(String(product.name || "").toLowerCase());
    codes.push(
      ["sku", "rk_sku", "model"].map((f) => String(product[f] || "").toLowerCase()).filter(Boolean)
    );
    primary.push(
      [...NAME_FIELDS, ...CODE_FIELDS].map((f) => product[f]).filter(Boolean).join(" ").toLowerCase()
    );

    // One posting per unique term per doc, weighted by the best field it hit.
    const weightByToken = new Map<string, number>();
    const collect = (fields: string[], w: number) => {
      for (const f of fields) {
        for (const t of tokenize(String(product[f] ?? ""))) {
          if ((weightByToken.get(t) || 0) < w) weightByToken.set(t, w);
        }
      }
    };
    collect(NAME_FIELDS, 10);
    collect(CODE_FIELDS, 8);
    collect(EXTRA_FIELDS, 3);

    for (const [t, w] of weightByToken) {
      const arr = index.get(t);
      if (arr) arr.push({ doc, w });
      else index.set(t, [{ doc, w }]);
    }
  });

  return { docs, index, names, codes, primary };
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

// Expand one query token to a doc -> score map by scanning the term
// dictionary once: exact postings at full weight, prefix/infix terms at
// reduced weight, then 1-edit fuzzy terms at the lowest weight.
function expandToken<T>(idx: ProductSearchIndex<T>, token: string): Map<number, number> {
  const scores = new Map<number, number>();
  const add = (postings: Posting[], mult: number) => {
    for (const p of postings) {
      const s = p.w * mult;
      if ((scores.get(p.doc) || 0) < s) scores.set(p.doc, s);
    }
  };
  const fuzzy = token.length >= 4;
  for (const [term, postings] of idx.index) {
    if (term === token) add(postings, EXACT_MULT);
    else if (term.startsWith(token)) add(postings, PREFIX_MULT);
    else if (term.includes(token)) add(postings, INFIX_MULT);
    else if (fuzzy && Math.abs(term.length - token.length) <= 1 && editDistance(token, term, 1) <= 1) {
      add(postings, FUZZY_MULT);
    }
  }
  return scores;
}

export function searchIndex<T = any>(
  idx: ProductSearchIndex<T>,
  query: string,
): { product: T; score: number }[] {
  const raw = query.trim().toLowerCase();
  const tokens = tokenize(raw);
  if (!tokens.length) return [];

  // AND-intersect per-token candidate sets, summing scores.
  let current: Map<number, number> | null = null;
  for (const t of tokens) {
    const cand = expandToken(idx, t);
    if (!cand.size) return [];
    if (!current) {
      current = cand;
    } else {
      for (const [doc, s] of current) {
        const o = cand.get(doc);
        if (o === undefined) current.delete(doc);
        else current.set(doc, s + o);
      }
      if (!current.size) return [];
    }
  }

  return [...(current || [])]
    .map(([doc, score]) => {
      let s = score;
      for (const t of tokens) {
        if (idx.primary[doc].includes(t)) s += 10;
        if (idx.names[doc].startsWith(t)) s += 5;
        for (const c of idx.codes[doc]) if (c === t) { s += 40; break; }
      }
      // Whole-query bonuses: exact SKU/model typed verbatim, or the full
      // phrase appearing in the primary fields (e.g. "merlin c945").
      if (idx.codes[doc].includes(raw)) s += 40;
      if (raw.length > 2 && idx.primary[doc].includes(raw)) s += 10;
      return { product: idx.docs[doc], score: s };
    })
    .sort((a, b) => b.score - a.score);
}
