const EXACT_CATEGORY_ALIASES: Record<string, string> = {
  all: "all",
  "all-products": "all",
  products: "all",
  "garage-gate": "garage",
  "garage-and-gate": "garage",
  garagegate: "garage",
  garage: "garage",
  automotive: "car",
  auto: "car",
  car: "car",
  "for-the-home": "home",
  "for-home": "home",
  home: "home",
  "home-automation": "home",
  locksmithing: "locksmith",
  locksmith: "locksmith",
};

const MENU_CATEGORY_TO_PRODUCTS_CATEGORY: Record<string, string> = {
  "garage-gate": "garage",
  automotive: "car",
  "for-the-home": "home",
  locksmithing: "locksmith",
  "shop-by-brand": "all",
  support: "all",
  contact: "all",
};

function normalizeCategoryInput(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function resolveProductCategory(value: unknown) {
  const normalized = normalizeCategoryInput(value);
  if (!normalized) return "all";

  const exact = EXACT_CATEGORY_ALIASES[normalized];
  if (exact) return exact;

  const tokens = new Set(normalized.split("-").filter(Boolean));

  if (tokens.has("garage") || tokens.has("gate")) return "garage";
  if (
    tokens.has("automotive") ||
    tokens.has("auto") ||
    tokens.has("car") ||
    tokens.has("vehicle") ||
    tokens.has("vehicles")
  ) {
    return "car";
  }
  if (
    tokens.has("home") ||
    tokens.has("household") ||
    tokens.has("residential")
  ) {
    return "home";
  }
  if (tokens.has("locksmith") || tokens.has("locksmithing")) {
    return "locksmith";
  }

  return normalized;
}

export function resolveProductsCategoryFromMenu(value: unknown) {
  const normalized = normalizeCategoryInput(value);
  if (!normalized) return "all";
  return MENU_CATEGORY_TO_PRODUCTS_CATEGORY[normalized] || resolveProductCategory(normalized);
}

export function matchesSelectedCategory(productCategory: unknown, selectedCategory: unknown) {
  const selected = resolveProductCategory(selectedCategory);
  if (selected === "all") return true;
  const product = resolveProductCategory(productCategory);
  return product === selected;
}

export function toProductsCategoryPath(value: unknown) {
  const category = resolveProductsCategoryFromMenu(value);
  return `/products/${category === "all" ? "all" : category}`;
}
