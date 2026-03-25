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

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  all: "Shop All Products",
  garage: "Garage Door Remotes",
  car: "Car Remotes",
  home: "For The Home",
  locksmith: "Locksmithing",
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  garage: [
    "garage",
    "garage door",
    "roller door",
    "gate",
    "opener",
    "receiver",
    "sectional door",
    "swing gate",
    "slide gate",
  ],
  car: [
    "car",
    "automotive",
    "vehicle",
    "key fob",
    "smart key",
    "transponder",
    "key shell",
    "flip key",
  ],
  home: [
    "home",
    "tv remote",
    "air conditioner",
    "aircon",
    "ac remote",
    "alarm remote",
    "blind remote",
    "ceiling fan",
  ],
  locksmith: [
    "locksmith",
    "key cutting",
    "lock pick",
    "pick set",
    "decoder",
    "programmer",
    "xhorse",
    "autel",
    "keydiy",
    "lishi",
  ],
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

function normalizeSearchText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function scoreCategoriesFromText(value: unknown) {
  const text = normalizeSearchText(value);
  if (!text) return {} as Record<string, number>;

  const paddedText = ` ${text} `;
  const scores: Record<string, number> = {};

  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    let score = 0;
    keywords.forEach((keyword) => {
      const normalizedKeyword = normalizeSearchText(keyword);
      if (!normalizedKeyword) return;
      if (paddedText.includes(` ${normalizedKeyword} `)) {
        score += normalizedKeyword.includes(" ") ? 2 : 1;
      }
    });
    if (score > 0) scores[category] = score;
  });

  return scores;
}

function getTextMatchedCategories(value: unknown) {
  const scores = scoreCategoriesFromText(value);
  return new Set(Object.keys(scores).filter((key) => scores[key] > 0));
}

function getProductText(product: any) {
  return [
    product?.name,
    product?.title,
    product?.model,
    product?.description,
    product?.product_description,
    product?.product_group,
    product?.brand,
    product?.sku,
  ]
    .filter(Boolean)
    .join(" ");
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

export function getProductCategorySignals(product: any) {
  const signals = new Set<string>();

  const fieldCategory = resolveProductCategory(product?.category);
  if (fieldCategory !== "all") signals.add(fieldCategory);

  const textMatches = getTextMatchedCategories(getProductText(product));
  textMatches.forEach((category) => signals.add(category));

  return signals;
}

export function matchesSelectedCategory(productCategory: unknown, selectedCategory: unknown) {
  const selected = resolveProductCategory(selectedCategory);
  if (selected === "all") return true;
  const product = resolveProductCategory(productCategory);
  return product === selected;
}

export function matchesProductToCategory(product: any, selectedCategory: unknown) {
  const selected = resolveProductCategory(selectedCategory);
  if (selected === "all") return true;

  const signals = getProductCategorySignals(product);
  if (signals.has(selected)) return true;

  return matchesSelectedCategory(product?.category, selected);
}

export function getCategoryPageTitle(value: unknown) {
  const normalized = normalizeCategoryInput(value);
  const resolved = resolveProductCategory(value);

  if (resolved === "all") return CATEGORY_DISPLAY_NAMES.all;

  if (
    normalized &&
    normalized !== resolved &&
    !Object.prototype.hasOwnProperty.call(EXACT_CATEGORY_ALIASES, normalized)
  ) {
    return toTitleCase(normalized.replace(/-/g, " "));
  }

  return CATEGORY_DISPLAY_NAMES[resolved] || toTitleCase(resolved.replace(/-/g, " "));
}

export function toProductsCategoryPath(value: unknown) {
  const category = resolveProductsCategoryFromMenu(value);
  return `/products/${category === "all" ? "all" : category}`;
}

export function toCategoryProductsPath(value: unknown) {
  const category = resolveProductsCategoryFromMenu(value);
  if (!category || category === "all") return null;
  return `/products/${category}`;
}

export function toProductsPathFromNavigationPath(pathname: unknown) {
  const value = String(pathname || "").trim();
  if (!value.startsWith("/")) return null;
  const firstSegment = value.split("/").filter(Boolean)[0];
  if (!firstSegment) return null;
  return toCategoryProductsPath(firstSegment);
}
