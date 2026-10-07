import { NextResponse } from "next/server";
import {
  getApprovedProductReviews,
  getProductReviewSummary,
  createProductReview,
} from "../../../lib/product-reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }
    const [reviews, summary] = await Promise.all([
      getApprovedProductReviews(productId),
      getProductReviewSummary(productId),
    ]);
    return NextResponse.json(
      { reviews, summary },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load reviews", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const result = await createProductReview({
      productId: body.productId,
      name: body.name,
      email: body.email,
      rating: body.rating,
      text: body.text,
    });
    if (result.ok === false) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save review", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}