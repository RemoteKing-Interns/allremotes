import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { readContentJson } from "@/lib/content-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default shipping options (fixed prices)
const defaultShippingOptions = {
  options: [
    { id: "free", name: "Free Untracked Shipping", price: 0, duration: "2-10 business days", enabled: true },
    { id: "tracked", name: "Tracked Shipping", price: 12, duration: "2-6 business days", enabled: true },
    { id: "express", name: "Express Shipping", price: 18, duration: "1-3 business days", enabled: true },
  ]
};

// Map options to rates format
const mapOptionsToRates = (options: any[]) => {
  return options
    .filter((opt: any) => opt.enabled !== false)
    .map((opt: any) => ({
      service_code: opt.id,
      service_name: opt.name,
      total_price: Number(opt.price),
      transit_time: opt.duration,
      currency: "AUD",
    }));
};

async function getShippingSettings(): Promise<{ options: Array<{ id: string; name: string; price: number; duration: string; enabled: boolean }> }> {
  // Always use default options with correct names, merge with DB for enabled/price overrides only
  const defaults = [
    { id: "free", name: "Free Untracked Shipping", price: 0, duration: "2-10 business days", enabled: true },
    { id: "tracked", name: "Tracked Shipping", price: 12, duration: "2-6 business days", enabled: true },
    { id: "express", name: "Express Shipping", price: 18, duration: "1-3 business days", enabled: true },
  ];
  
  try {
    let dbOptions: any[] = [];
    
    if (mongoEnabled()) {
      const db = await getDb();
      const col = db.collection<{ _id: string; data: any }>("content");
      const doc = await col.findOne({ _id: "shipping" });
      if (doc?.data?.options && Array.isArray(doc.data.options)) {
        dbOptions = doc.data.options;
      }
    } else {
      const doc = await readContentJson("shipping");
      if (doc?.data?.options && Array.isArray(doc.data.options)) {
        dbOptions = doc.data.options;
      }
    }
    
    // Merge defaults with DB values (only use DB for enabled status and price overrides)
    const merged = defaults.map(def => {
      const dbOpt = dbOptions.find((o: any) => o?.id === def.id);
      return {
        ...def,
        enabled: dbOpt?.enabled ?? def.enabled,
        price: dbOpt?.price !== undefined ? Number(dbOpt.price) : def.price,
      };
    });
    
    return { options: merged };
  } catch (e) {
    console.error("Failed to load shipping settings:", e);
  }
  
  return { options: defaults };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { address, items, cartTotal } = body || {};

    // Get shipping options from settings
    const settings = await getShippingSettings();
    
    // Filter only enabled options and format for display
    const rates = settings.options
      .filter((opt: any) => opt.enabled !== false)
      .map((opt: any) => ({
        service_code: opt.id,
        service_name: opt.name,
        total_price: Number(opt.price),
        transit_time: opt.duration,
        currency: "AUD",
      }));

    // If no rates available, return defaults
    if (rates.length === 0) {
      return NextResponse.json({
        success: true,
        rates: defaultShippingOptions.options.map(opt => ({
          service_code: opt.id,
          service_name: opt.name,
          total_price: opt.price,
          transit_time: opt.duration,
          currency: "AUD",
        }))
      });
    }

    return NextResponse.json({
      success: true,
      rates,
    });
  } catch (error: any) {
    console.error("Shipping rates error:", error);
    // Return default rates on error
    return NextResponse.json({
      success: true,
      rates: defaultShippingOptions.options.map(opt => ({
        service_code: opt.id,
        service_name: opt.name,
        total_price: opt.price,
        transit_time: opt.duration,
        currency: "AUD",
      }))
    });
  }
}

export async function GET() {
  try {
    const settings = await getShippingSettings();
    return NextResponse.json({
      success: true,
      options: settings.options,
    });
  } catch (error: any) {
    console.error("Shipping settings error:", error);
    return NextResponse.json({
      success: true,
      options: defaultShippingOptions.options,
    });
  }
}
