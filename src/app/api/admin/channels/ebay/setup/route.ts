import { NextResponse } from "next/server";
import { createEbayInventoryLocation } from "@/lib/channels/ebay";
import { getValidCredentials } from "@/lib/channels/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const postcode = searchParams.get("postcode");
  const country = searchParams.get("country") || "AU";

  if (!city || !state || !postcode) {
    return NextResponse.json(
      { error: "Missing city, state or postcode" },
      { status: 400 }
    );
  }

  try {
    const creds = await getValidCredentials("ebay");
    await createEbayInventoryLocation({ city, state, postcode, country }, creds.accessToken);
    return NextResponse.json({
      ok: true,
      locationKey: process.env.EBAY_MERCHANT_LOCATION_KEY,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create eBay inventory location", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
