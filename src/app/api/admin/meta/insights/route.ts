import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRESETS: Record<string, string> = { "7d": "last_7d", "30d": "last_30d", "90d": "last_90d" };
const PURCHASE_TYPES = new Set(["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"]);

function summarize(row: any) {
  const purchases = (row.actions || [])
    .filter((a: any) => PURCHASE_TYPES.has(a.action_type))
    .reduce((s: number, a: any) => s + Number(a.value || 0), 0);
  const costPerPurchase = (row.cost_per_action_type || [])
    .filter((a: any) => PURCHASE_TYPES.has(a.action_type))
    .reduce((s: number, a: any) => s + Number(a.value || 0), 0);
  return {
    name: row.campaign_name || row.adset_name || row.ad_name || "Account",
    spend: Number(row.spend || 0),
    impressions: Number(row.impressions || 0),
    reach: Number(row.reach || 0),
    clicks: Number(row.clicks || 0),
    ctr: Number(row.ctr || 0),
    cpc: Number(row.cpc || 0),
    purchases,
    costPerPurchase: costPerPurchase || null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const preset = PRESETS[searchParams.get("range") || "30d"] || "last_30d";

  try {
    const { metaAdInsights } = await import("@/lib/channels/meta");
    const [account, campaigns] = await Promise.all([
      metaAdInsights("account", preset),
      metaAdInsights("campaign", preset),
    ]);
    return NextResponse.json({
      totals: account.data?.[0] ? summarize(account.data[0]) : null,
      campaigns: (campaigns.data || []).map(summarize),
    });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = /must be set/.test(msg) ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
