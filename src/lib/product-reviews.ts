import { getDb, mongoEnabled } from "./mongo";
import { emailHash } from "./pii-crypto";

/**
 * Product-level customer reviews stored in the `product_reviews` collection.
 * Reviews are limited to verified buyers: the reviewer's email must match a
 * non-cancelled order containing the product. Verified reviews are published
 * immediately, so no moderation queue is required; one review per customer
 * per product (re-submitting updates it).
 */

export type ProductReview = {
  productId: string;
  name: string;
  rating: number; // 1-5
  text: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductReviewSummary = {
  average: number | null;
  count: number;
};

const MAX_REVIEWS_PER_PRODUCT = 50;

export async function getApprovedProductReviews(productId: string): Promise<ProductReview[]> {
  if (!productId || !mongoEnabled()) return [];
  try {
    const db = await getDb();
    const docs = await db
      .collection("product_reviews")
      .find(
        { productId: String(productId), approved: true },
        { projection: { _id: 0, productId: 1, name: 1, rating: 1, text: 1, verifiedPurchase: 1, createdAt: 1 } }
      )
      .sort({ createdAt: -1 })
      .limit(MAX_REVIEWS_PER_PRODUCT)
      .toArray();
    return docs as unknown as ProductReview[];
  } catch (err: any) {
    console.error("Failed to load product reviews:", err?.message || err);
    return [];
  }
}

export async function getProductReviewSummary(productId: string): Promise<ProductReviewSummary> {
  if (!productId || !mongoEnabled()) return { average: null, count: 0 };
  try {
    const db = await getDb();
    const result = await db
      .collection("product_reviews")
      .aggregate<{ _id: null; avg: number; count: number }>([
        { $match: { productId: String(productId), approved: true } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ])
      .toArray();
    if (result.length === 0) return { average: null, count: 0 };
    return { average: Math.round(result[0].avg * 10) / 10, count: result[0].count };
  } catch (err: any) {
    console.error("Failed to summarise product reviews:", err?.message || err);
    return { average: null, count: 0 };
  }
}

export type CreateReviewResult =
  | { ok: true; updated: boolean }
  | { ok: false; error: string };

export async function createProductReview(input: {
  productId: string;
  name?: string;
  email: string;
  rating: number;
  text: string;
}): Promise<CreateReviewResult> {
  const productId = String(input.productId || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const rating = Math.round(Number(input.rating));
  const text = String(input.text || "").trim();
  const name = String(input.name || "").trim() || "Verified Buyer";

  if (!productId) return { ok: false, error: "Missing product" };
  if (!email || !email.includes("@")) return { ok: false, error: "A valid email is required" };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return { ok: false, error: "Rating must be between 1 and 5" };
  if (text.length < 5) return { ok: false, error: "Please write at least a few words" };
  if (text.length > 2000) return { ok: false, error: "Review is too long (2000 characters max)" };
  if (!mongoEnabled()) return { ok: false, error: "Reviews are unavailable right now" };

  const hash = emailHash(email);

  try {
    const db = await getDb();

    // Verified buyers only: a real, non-cancelled order containing this product.
    const order = await db.collection("orders").findOne(
      {
        "customer.emailHash": hash,
        "items.id": productId,
        status: { $ne: "cancelled" },
      },
      { projection: { _id: 1 } }
    );
    if (!order) {
      return { ok: false, error: "We could not match this email to an order containing this product. Reviews are limited to verified buyers." };
    }

    const now = new Date().toISOString();
    const review = {
      productId,
      name: name.slice(0, 60),
      rating,
      text,
      verifiedPurchase: true,
      approved: true,
      emailHash: hash,
      updatedAt: now,
    };

    await db.collection("product_reviews").updateOne(
      { productId, emailHash: hash },
      { $set: review, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    return { ok: true, updated: false };
  } catch (err: any) {
    console.error("Failed to save product review:", err?.message || err);
    return { ok: false, error: "Could not save your review right now" };
  }
}
