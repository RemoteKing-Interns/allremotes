import type { MetadataRoute } from "next";
import { getNavigationPaths, getPublicProducts } from "@/lib/public-site";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "/",
  "/garage-gate",
  "/automotive",
  "/for-the-home",
  "/locksmithing",
  "/shop-by-brand",
  "/support",
  "/contact",
  "/products/all",
  "/products/garage",
  "/products/car",
] as const;

type SitemapEntry = MetadataRoute.Sitemap[number];

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, `${getSiteUrl()}/`).toString();
}

function toDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getLatestDate(...values: Array<Date | string | null | undefined>) {
  let latest: Date | undefined;

  values.forEach((value) => {
    const next = value instanceof Date ? value : toDate(value);
    if (!next) return;
    if (!latest || next.getTime() > latest.getTime()) latest = next;
  });

  return latest;
}

function normalizeCategory(category: string | null | undefined) {
  const value = String(category || "").trim().toLowerCase();
  if (!value || value === "all") return null;
  return value;
}

function upsertEntry(
  entries: Map<string, SitemapEntry>,
  pathname: string,
  nextEntry: Omit<SitemapEntry, "url">,
) {
  const current = entries.get(pathname);

  if (!current) {
    entries.set(pathname, {
      url: toAbsoluteUrl(pathname),
      ...nextEntry,
    });
    return;
  }

  entries.set(pathname, {
    ...current,
    ...nextEntry,
    url: current.url,
    lastModified: getLatestDate(current.lastModified, nextEntry.lastModified),
    priority: Math.max(current.priority ?? 0, nextEntry.priority ?? 0),
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ paths: navigationPaths, updatedAt: navigationUpdatedAt }, products] =
    await Promise.all([getNavigationPaths(), getPublicProducts()]);

  const latestProductUpdate = getLatestDate(
    ...products.flatMap((product) => [product.updatedAt, product.createdAt]),
  );

  const categoryLastModified = new Map<string, Date>();
  const entries = new Map<string, SitemapEntry>();

  products.forEach((product) => {
    const productId = String(product?.id || "").trim();
    if (!productId) return;

    const updatedAt = getLatestDate(product.updatedAt, product.createdAt);
    upsertEntry(entries, `/product/${encodeURIComponent(productId)}`, {
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });

    const category = normalizeCategory(product.category);
    if (!category || !updatedAt) return;

    const current = categoryLastModified.get(category);
    if (!current || updatedAt.getTime() > current.getTime()) {
      categoryLastModified.set(category, updatedAt);
    }
  });

  STATIC_ROUTES.forEach((pathname) => {
    const isHome = pathname === "/";
    const isProductListing = pathname.startsWith("/products/");

    upsertEntry(entries, pathname, {
      lastModified: getLatestDate(
        isProductListing ? latestProductUpdate : null,
        navigationUpdatedAt,
      ),
      changeFrequency: isHome || isProductListing ? "daily" : "weekly",
      priority: isHome ? 1 : isProductListing ? 0.85 : 0.8,
    });
  });

  navigationPaths.forEach((pathname) => {
    upsertEntry(entries, pathname, {
      lastModified: getLatestDate(navigationUpdatedAt),
      changeFrequency: pathname === "/contact" ? "monthly" : "weekly",
      priority: pathname.split("/").filter(Boolean).length > 1 ? 0.6 : 0.75,
    });
  });

  categoryLastModified.forEach((lastModified, category) => {
    upsertEntry(entries, `/products/${category}`, {
      lastModified,
      changeFrequency: "daily",
      priority: 0.85,
    });
  });

  return Array.from(entries.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, entry]) => entry);
}
