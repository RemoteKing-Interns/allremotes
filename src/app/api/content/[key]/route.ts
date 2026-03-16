import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { readContentJson, writeContentJson } from "@/lib/content-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ALLOWED = new Set(["home", "navigation", "reviews", "promotions", "settings"]);

const isRecord = (value: any): value is Record<string, any> => {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
};

const slugify = (value: string) => {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "general";
};

const normalizeNavigation = (data: any) => {
  if (!data) return data;
  if (Array.isArray(data)) {
    const out: Record<string, any> = {};
    data.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const id = String(item.id || "").trim() || `item_${index + 1}`;
      out[id] = {
        title: item.label ?? item.title ?? id,
        path: item.link ?? item.path ?? "",
        hidden: item.visible === false,
        columns: Array.isArray(item.columns) ? item.columns : [],
      };
    });
    return out;
  }
  return data;
};

const normalizeHome = (data: any) => {
  if (!isRecord(data)) return data;
  if (data?.hero?.primaryCta || data?.hero?.primaryCtaPath || data?.ctaSection) return data;

  const hero = isRecord(data.hero) ? data.hero : {};
  const buttons = Array.isArray(hero.buttons) ? hero.buttons : [];
  const primary = buttons[0] || {};
  const secondary = buttons[1] || {};

  return {
    ...data,
    hero: {
      title: hero.title ?? "",
      subtitle: hero.subtitle ?? "",
      description: hero.description ?? "",
      primaryCta: primary.label ?? "",
      primaryCtaPath: primary.link ?? "",
      secondaryCta: secondary.label ?? "",
      secondaryCtaPath: secondary.link ?? "",
    },
    features: Array.isArray(data.features)
      ? data.features.map((f: any) => ({
          ...f,
          path: f?.path ?? f?.link ?? "",
          linkText: f?.linkText ?? (f?.link ? "Explore ->" : ""),
        }))
      : [],
    whyBuy: Array.isArray(data.whyBuy) ? data.whyBuy : [],
    ctaSection: data.ctaSection ?? {
      title: data.cta?.title ?? "",
      description: data.cta?.description ?? "",
      buttonText: data.cta?.buttonText ?? "",
      buttonPath: data.cta?.buttonLink ?? "",
    },
  };
};

const normalizePromotions = (data: any) => {
  if (!isRecord(data)) return data;
  if (data.topInfoBar || data.offers?.categories) return data;

  const infoBar = Array.isArray(data.infoBar) ? data.infoBar : [];
  const offerGroups = Array.isArray(data.offers) ? data.offers : [];

  const categories = offerGroups.map((group: any, index: number) => {
    const name = String(group?.name || "Offer Category").trim();
    return { id: group?.id || slugify(name || `category-${index + 1}`), name };
  });

  const offers: any[] = [];
  offerGroups.forEach((group: any, index: number) => {
    const category = categories[index];
    const discounts = Array.isArray(group?.discounts) ? group.discounts : [];
    discounts.forEach((disc: any, dIndex: number) => {
      const discObj = isRecord(disc) ? disc : {};
      const percent = Number(discObj.discountPercent ?? discObj.percent ?? disc ?? 0);
      offers.push({
        id: discObj.id || `${category?.id || "category"}_${dIndex + 1}`,
        categoryId: category?.id || "",
        name: discObj.name || `${category?.name || "Offer"} Discount`,
        enabled: Boolean(discObj.enabled),
        appliesTo: discObj.appliesTo || "all",
        discountPercent: Number.isFinite(percent) ? percent : 0,
        startDate: discObj.startDate || "",
        endDate: discObj.endDate || "",
      });
    });
  });

  return {
    topInfoBar: {
      enabled: infoBar.length > 0,
      items: infoBar,
    },
    offers: {
      categories,
      offers,
      stackWithMemberDiscount: false,
    },
  };
};

const normalizeSettings = (data: any) => {
  if (!isRecord(data)) return data;
  if (data.siteEmail || !data.contactEmail) return data;
  return { ...data, siteEmail: data.contactEmail };
};

const normalizeContent = (key: string, data: any) => {
  switch (key) {
    case "navigation":
      return normalizeNavigation(data);
    case "home":
      return normalizeHome(data);
    case "promotions":
      return normalizePromotions(data);
    case "settings":
      return normalizeSettings(data);
    default:
      return data;
  }
};

const serializeNavigation = (data: any) => {
  if (!data) return data;
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return data;

  return Object.entries(data).map(([id, section]) => ({
    id,
    label: (section as any)?.title ?? id,
    link: (section as any)?.path ?? "",
    iconIndex: (section as any)?.iconIndex ?? 0,
    visible: !(section as any)?.hidden,
    columns: Array.isArray((section as any)?.columns) ? (section as any).columns : [],
  }));
};

const serializeHome = (data: any) => {
  if (!isRecord(data)) return data;
  if (Array.isArray(data?.hero?.buttons)) return data;

  const hero = isRecord(data.hero) ? data.hero : {};
  const buttons: Array<{ label: string; link: string }> = [];

  if (hero.primaryCta || hero.primaryCtaPath) {
    buttons.push({
      label: hero.primaryCta ?? "",
      link: hero.primaryCtaPath ?? "",
    });
  }

  if (hero.secondaryCta || hero.secondaryCtaPath) {
    buttons.push({
      label: hero.secondaryCta ?? "",
      link: hero.secondaryCtaPath ?? "",
    });
  }

  return {
    hero: {
      title: hero.title ?? "",
      subtitle: hero.subtitle ?? "",
      description: hero.description ?? "",
      buttons,
    },
    features: Array.isArray(data.features)
      ? data.features.map((f: any) => ({
          icon: f?.icon ?? "",
          title: f?.title ?? "",
          description: f?.description ?? "",
          link: f?.link ?? f?.path ?? "",
        }))
      : [],
    whyBuy: Array.isArray(data.whyBuy)
      ? data.whyBuy.map((b: any) => ({
          icon: b?.icon ?? "",
          title: b?.title ?? "",
          description: b?.description ?? "",
        }))
      : [],
    cta: {
      title: data.cta?.title ?? data.ctaSection?.title ?? "",
      description: data.cta?.description ?? data.ctaSection?.description ?? "",
      buttonText: data.cta?.buttonText ?? data.ctaSection?.buttonText ?? "",
      buttonLink: data.cta?.buttonLink ?? data.ctaSection?.buttonPath ?? "",
    },
  };
};

const serializePromotions = (data: any) => {
  if (!isRecord(data)) return data;
  if (Array.isArray(data.infoBar) && Array.isArray(data.offers)) return data;

  const infoBar = Array.isArray(data?.topInfoBar?.items) ? data.topInfoBar.items : [];
  const categories = Array.isArray(data?.offers?.categories) ? data.offers.categories : [];
  const offers = Array.isArray(data?.offers?.offers) ? data.offers.offers : [];

  if (categories.length === 0 && offers.length > 0) {
    categories.push({ id: "general", name: "General" });
  }

  const groups = categories.map((category: any) => {
    const categoryId = category?.id || slugify(category?.name || "general");
    const name = category?.name || "General";
    return {
      id: categoryId,
      name,
      discounts: offers
        .filter((offer: any) => (offer?.categoryId || "general") === categoryId)
        .map((offer: any) => ({
          id: offer?.id || `${categoryId}_${slugify(offer?.name || "offer")}`,
          name: offer?.name || "Offer",
          enabled: Boolean(offer?.enabled),
          appliesTo: offer?.appliesTo || "all",
          discountPercent: Number(offer?.discountPercent || 0),
          startDate: offer?.startDate || "",
          endDate: offer?.endDate || "",
        })),
    };
  });

  return { infoBar, offers: groups };
};

const serializeSettings = (data: any) => {
  if (!isRecord(data)) return data;
  if (data.contactEmail || data.showOutOfStock != null) return data;
  return {
    siteName: data.siteName ?? "",
    contactEmail: data.siteEmail ?? "",
    currency: data.currency ?? "AUD",
    showOutOfStock: true,
  };
};

const serializeContent = (key: string, data: any) => {
  switch (key) {
    case "navigation":
      return serializeNavigation(data);
    case "home":
      return serializeHome(data);
    case "promotions":
      return serializePromotions(data);
    case "settings":
      return serializeSettings(data);
    default:
      return data;
  }
};

export async function GET(_: Request, context: { params: Promise<{ key: string }> }) {
  try {
    const { key: rawKey } = await context.params;
    const key = String(rawKey || "").trim().toLowerCase();
    if (!ALLOWED.has(key)) return NextResponse.json({ error: "Unknown content key" }, { status: 404 });

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: any; updatedAt: string }>("content");

      const doc = await col.findOne({ _id: key });
      if (!doc) {
        const now = new Date().toISOString();
        await col.insertOne({ _id: key, data: null, updatedAt: now });
        return NextResponse.json({ key, data: null, updatedAt: now });
      }

      return NextResponse.json({
        key,
        data: normalizeContent(key, (doc as any).data ?? null),
        updatedAt: (doc as any).updatedAt ?? null,
      });
    }

    const doc = await readContentJson(key);
    if (doc.updatedAt == null) {
      const { updatedAt } = await writeContentJson(key, doc.data ?? null);
      return NextResponse.json({ key, data: normalizeContent(key, doc.data ?? null), updatedAt });
    }
    return NextResponse.json({ key, data: normalizeContent(key, doc.data ?? null), updatedAt: doc.updatedAt });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load content", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ key: string }> }) {
  try {
    const { key: rawKey } = await context.params;
    const key = String(rawKey || "").trim().toLowerCase();
    if (!ALLOWED.has(key)) return NextResponse.json({ error: "Unknown content key" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const now = new Date().toISOString();
    const serialized = serializeContent(key, body ?? null);

    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: any; updatedAt: string }>("content");
      await col.updateOne(
        { _id: key },
        { $set: { data: serialized ?? null, updatedAt: now } },
        { upsert: true }
      );
      return NextResponse.json({ ok: true, key, updatedAt: now });
    }

    const { updatedAt } = await writeContentJson(key, serialized ?? null);
    return NextResponse.json({ ok: true, key, updatedAt });

  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save content", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
