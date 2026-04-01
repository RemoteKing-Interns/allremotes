import { navigationMenu as defaultNavigationMenu } from "@/data/navigation";
import { readContentJson } from "@/lib/content-json";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { readProductsJson } from "@/lib/products-json";
import { getSiteUrl } from "@/lib/site-url";

type NavigationItem = {
  hidden?: boolean;
  path?: string;
  columns?: Array<{
    hidden?: boolean;
    items?: Array<{
      hidden?: boolean;
      path?: string;
    }>;
  }>;
};

type NavigationTree = Record<string, NavigationItem>;

type ContentDoc<T = any> = {
  data: T | null;
  updatedAt: string | null;
};

type ProductRecord = {
  id?: string | number;
  sku?: string;
  brand?: string;
  name?: string;
  category?: string | null;
  price?: number;
  inStock?: boolean;
  image?: string; // Legacy single image (backward compat)
  images?: string[]; // New: array of up to 3 image URLs
  imgIndex?: number; // New: which image is primary/thumbnail (default 0)
  condition?: string; // New: e.g., Brand New
  description?: string;
  updatedAt?: string | null;
  createdAt?: string | null;
};

function normalizeNavigation(data: any): NavigationTree | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    const out: NavigationTree = {};

    data.forEach((item, index) => {
      if (!item || typeof item !== "object") return;

      const id = String(item.id || "").trim() || `item_${index + 1}`;
      out[id] = {
        path: item.link ?? item.path ?? "",
        hidden: item.visible === false,
        columns: Array.isArray(item.columns) ? item.columns : [],
      };
    });

    return out;
  }

  if (typeof data === "object") return data as NavigationTree;
  return null;
}

function normalizePath(pathname: string) {
  const raw = String(pathname || "").trim();
  if (!raw) return null;

  try {
    const site = new URL(`${getSiteUrl()}/`);

    if (/^https?:\/\//i.test(raw)) {
      const external = new URL(raw);
      if (external.origin !== site.origin) return null;
      const normalized = `${external.pathname}${external.search}`;
      return normalized === "/" ? normalized : normalized.replace(/\/$/, "");
    }
  } catch {
    return null;
  }

  const prefixed = raw.startsWith("/") ? raw : `/${raw}`;
  return prefixed === "/" ? prefixed : prefixed.replace(/\/$/, "");
}

function isIndexablePath(pathname: string) {
  return ![
    "/admin",
    "/api",
    "/account",
    "/cart",
    "/checkout",
    "/login",
    "/register",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function collectNavigationPaths(nav: NavigationTree | null | undefined) {
  const paths = new Set<string>();
  if (!nav || typeof nav !== "object") return paths;

  Object.values(nav).forEach((section) => {
    if (!section || section.hidden) return;

    const sectionPath = normalizePath(section.path || "");
    if (sectionPath && isIndexablePath(sectionPath)) paths.add(sectionPath);

    (section.columns || []).forEach((column) => {
      if (!column || column.hidden) return;

      (column.items || []).forEach((item) => {
        if (!item || item.hidden) return;

        const itemPath = normalizePath(item.path || "");
        if (itemPath && isIndexablePath(itemPath)) paths.add(itemPath);
      });
    });
  });

  return paths;
}

async function readContentDoc(key: string): Promise<ContentDoc> {
  if (mongoEnabled()) {
    const db = await getDb();
    const doc = await db
      .collection<{ _id: string; data: any; updatedAt: string }>("content")
      .findOne({ _id: key });

    return {
      data: doc?.data ?? null,
      updatedAt: doc?.updatedAt ?? null,
    };
  }

  return readContentJson(key);
}

export async function getPublicProducts(): Promise<ProductRecord[]> {
  if (mongoEnabled()) {
    const db = await getDb();
    const products = await db
      .collection("products")
      .find({})
      .toArray();

    return Array.isArray(products) ? (products as ProductRecord[]) : [];
  }

  const products = await readProductsJson();
  return Array.isArray(products) ? (products as ProductRecord[]) : [];
}

export async function getNavigationPaths(): Promise<{
  paths: string[];
  updatedAt: string | null;
}> {
  const { data, updatedAt } = await readContentDoc("navigation");
  const configured = collectNavigationPaths(normalizeNavigation(data));
  const defaults = collectNavigationPaths(defaultNavigationMenu as NavigationTree);

  return {
    paths: Array.from(new Set([...defaults, ...configured])).sort(),
    updatedAt,
  };
}

