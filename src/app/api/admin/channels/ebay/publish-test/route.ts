import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { eBayAdapter, guessCategory, getRequiredAspects } from "@/lib/channels/ebay";
import { getValidCredentials, saveChannelListing } from "@/lib/channels/db";
import { getProductSkuForKey } from "@/lib/products-import";
import { toPublicImageUrls } from "@/lib/channels/images";

function buildListingPayload(product: any, suffix?: string) {
  const baseSku = product.sku || getProductSkuForKey(product) || product.id;
  const sku = suffix ? `${baseSku}-${suffix}` : baseSku;
  const price = Number(product.price || 0);
  const quantity = Number(product.quantity || product.stock || (product.inStock ? 1 : 0));
  const images = toPublicImageUrls(
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : []
  );
  const title = `${product.brand || "ALLREMOTES"} ${product.model || product.name || sku}`.trim();
  const description =
    product.description?.trim() ||
    `High-quality ${title}. Professional replacement remote with reliable performance.`;

  return {
    sku,
    title,
    description,
    brand: product.brand || "ALLREMOTES",
    condition: product.condition || "Brand New",
    price,
    currency: process.env.DEFAULT_CURRENCY || "AUD",
    quantity,
    images,
    category: product.marketplaceCategory?.ebay,
    mpn: product.mpn,
    gtin: product.gtin,
    type: product.type,
    packageWeight: product.packageWeight,
    packageDimensions: product.packageDimensions,
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const product = await db.collection("products").findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const creds = await getValidCredentials("ebay");
    let categoryId = product.marketplaceCategory?.ebay;

    if (!categoryId || categoryId === "0") {
      categoryId = await guessCategory(product.name || product.sku || product.id);
      if (categoryId) {
        await db
          .collection("products")
          .updateOne({ id: productId }, { $set: { "marketplaceCategory.ebay": categoryId } });
      }
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Could not determine an eBay category for this product. Set product.marketplaceCategory.ebay manually." },
        { status: 400 }
      );
    }

    product.marketplaceCategory = { ...product.marketplaceCategory, ebay: categoryId };

    // Fetch required aspects from eBay Taxonomy API and build a complete aspect map
    const requiredAspects = await getRequiredAspects(categoryId);
    const productAspects: Record<string, string[]> = {};
    for (const [aspectName, values] of Object.entries(requiredAspects)) {
      if (aspectName.toLowerCase() === "type") {
        productAspects[aspectName] = values.length ? [values[0]] : ["Remote Control"];
      } else if (aspectName.toLowerCase() === "brand") {
        productAspects[aspectName] = [product.brand || "ALLREMOTES"];
      } else if (aspectName.toLowerCase() === "mpn") {
        if (product.mpn) productAspects[aspectName] = [product.mpn];
        else productAspects[aspectName] = ["Does Not Apply"];
      } else if (aspectName.toLowerCase() === "model") {
        productAspects[aspectName] = [product.model || product.name || "Generic"];
      } else {
        productAspects[aspectName] = values.length ? [values[0]] : ["Unbranded"];
      }
    }

    const suffix = Date.now().toString();
    const payload = buildListingPayload(product, suffix);
    (payload as any).aspects = productAspects;

    const { externalId, externalUrl } = await eBayAdapter.publishListing(payload as any, creds);
    await saveChannelListing({
      productId,
      sku: payload.sku,
      channel: "ebay",
      externalId,
      externalUrl,
      status: "listed",
      lastSyncedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, externalId, externalUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: "eBay publish test failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
