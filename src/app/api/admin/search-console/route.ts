import { NextRequest, NextResponse } from "next/server";
import { getCachedSearchAnalytics, isSearchConsoleConfigured, GSCQueryParams } from "@/lib/search-console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  if (!isSearchConsoleConfigured()) {
    return NextResponse.json(
      { error: "Search Console not configured. Set GSC_SITE_URL and GSC_SERVICE_ACCOUNT_JSON in .env.local" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "7d";
  const dimension = searchParams.get("dimension") || "query";

  const dayMap: Record<string, number> = {
    "7d": 7,
    "28d": 28,
    "90d": 90,
  };
  const days = dayMap[range] ?? 7;

  const params: GSCQueryParams = {
    startDate: dateNDaysAgo(days),
    endDate: dateNDaysAgo(1), // yesterday (Search Console data has ~1-2 day delay)
    dimensions: [dimension],
    rowLimit: 50,
  };

  try {
    const data = await getCachedSearchAnalytics(params);
    return NextResponse.json({
      ...data,
      range,
      dimension,
      cached: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
