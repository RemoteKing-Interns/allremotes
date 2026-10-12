import { NextResponse } from "next/server";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { enrichProductsWithS3Images } from "@/lib/products-json";
import { buildFeedFields, FEED_BASE_URL } from "@/lib/feed-fields";

const BASE_URL = FEED_BASE_URL;

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hasRealIdentifiers(product: any, sku: string): boolean {
  const gtin = String(product.gtin?.trim() || "");
  // Treat the SKU as an MPN only if it looks like a real manufacturer code
  const looksLikeSku = sku.length >= 3 && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(sku);
  return Boolean(gtin) || looksLikeSku;
}

function generateProductXml(product: any, f: NonNullable<Awaited<ReturnType<typeof buildFeedFields>>>): string {
  const realIdentifiers = hasRealIdentifiers(product, f.sku);
  const mpn = realIdentifiers ? escapeXml(f.sku) : "";
  const gtin = escapeXml(String(product.gtin?.trim() || ""));

  const additionalImages = f.additionalImages
    .map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
    .join("\n    ");

  return `
  <item>
    <g:id>${escapeXml(f.id)}</g:id>
    <g:title>${escapeXml(f.title)}</g:title>
    <g:description>${escapeXml(f.description)}</g:description>
    <link>${escapeXml(f.link)}</link>
    <g:image_link>${escapeXml(f.imageLink)}</g:image_link>
    ${additionalImages ? `${additionalImages}\n    ` : ""}<g:availability>${f.availability}</g:availability>
    <g:price>${f.price}</g:price>
    <g:brand>${escapeXml(f.brand)}</g:brand>
    <g:condition>new</g:condition>
    <g:sku>${escapeXml(f.sku)}</g:sku>
    <g:product_type>${escapeXml(f.productType)}</g:product_type>
    ${mpn ? `\n    <g:mpn>${mpn}</g:mpn>` : ""}${gtin ? `\n    <g:gtin>${gtin}</g:gtin>` : ""}
    <g:identifier_exists>${realIdentifiers ? "yes" : "no"}</g:identifier_exists>
    <g:excluded_destination>local_inventory_ads</g:excluded_destination>
    <g:excluded_destination>free_local_listings</g:excluded_destination>
    <g:checkout_link_template>${escapeXml(`${BASE_URL}/cart?add=${f.id}`)}</g:checkout_link_template>
    <g:shipping>
      <g:country>AU</g:country>
      <g:service>Standard</g:service>
      <g:price>0.00 AUD</g:price>
    </g:shipping>
  </item>`;
}

export async function GET() {
  try {
    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured. Feed requires MongoDB." },
        { status: 503 }
      );
    }

    const db = await getDb();
    const col = db.collection("products");
    const mongoProducts = await col.find({
      $or: [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
        { status: "" },
      ],
    }).toArray();
    const productsArray = enrichProductsWithS3Images(mongoProducts);

    const fields = await Promise.all(productsArray.map(buildFeedFields));
    const items = fields
      .map((f, i) => (f ? generateProductXml(productsArray[i], f) : ""))
      .filter(Boolean)
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AllRemotes Products Feed</title>
    <link>${BASE_URL}</link>
    <description>Product feed for AllRemotes.com.au</description>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Error generating product feed:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Error</title>
    <description>Failed to generate product feed</description>
  </channel>
</rss>`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      }
    );
  }
}
