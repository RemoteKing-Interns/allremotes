import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { readContentJson } from "@/lib/content-json";
import { getStarshipitRates, starshipitConfigured, StarshipitAddress } from "@/lib/starshipit";

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

const DEFAULT_ITEM_WEIGHT_KG = Number(process.env.STARSHIPIT_DEFAULT_ITEM_WEIGHT || 0.1);
const DEFAULT_PACKAGE_WEIGHT_KG = Number(process.env.STARSHIPIT_DEFAULT_PACKAGE_WEIGHT || 0.5);

// Map internal fixed options to the UI rate format
function mapOptionsToUiRates(options: any[]) {
  return options
    .filter((opt: any) => opt.enabled !== false)
    .map((opt: any) => ({
      id: opt.id,
      name: opt.name,
      description: opt.duration,
      price: Number(opt.price),
      tracking: opt.id !== "free",
      icon: opt.id === "free" ? "📮" : opt.id === "express" ? "🚀" : "📦",
    }));
}

// Map Starshipit rate response to the UI rate format
function mapStarshipitRatesToUiRates(rates: any[]) {
  return rates.map((rate) => {
    const id = rate.service_name
      ? String(rate.service_name).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      : rate.service_code;
    const name = rate.service_name || rate.service_code;
    const isExpress = /express|priority|overnight|fast/i.test(name);
    const isUntracked = /untracked|no tracking|regular letter/i.test(name);
    return {
      id,
      name,
      description: "",
      price: Number(rate.total_price),
      tracking: !isUntracked,
      icon: isUntracked ? "📮" : isExpress ? "🚀" : "📦",
    };
  });
}

function buildPackages(items?: any[]) {
  if (!items || items.length === 0) {
    return [{ weight: DEFAULT_PACKAGE_WEIGHT_KG }];
  }

  const totalWeight = items.reduce((sum, item) => {
    const itemWeight = Number(item.weight || DEFAULT_ITEM_WEIGHT_KG);
    const qty = Number(item.quantity || 1);
    return sum + itemWeight * qty;
  }, 0);

  return [{ weight: Math.max(totalWeight, 0.01) }];
}

function buildDestination(address: any): StarshipitAddress {
  const country = String(address.country || "AU").toUpperCase();
  return {
    street: address.address,
    suburb: address.city,
    city: address.city,
    state: address.state,
    post_code: address.zipCode,
    country_code: country === "AU" ? "AU" : country,
  };
}

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
    const { address, items } = body || {};

    if (!address || !address.zipCode || !address.state) {
      return NextResponse.json({
        success: true,
        rates: mapOptionsToUiRates(defaultShippingOptions.options),
      });
    }

    // Try Starshipit live rates if configured
    if (starshipitConfigured()) {
      try {
        const destination = buildDestination(address);
        const packages = buildPackages(items);
        const starshipitRates = await getStarshipitRates({ destination, packages });
        if (Array.isArray(starshipitRates) && starshipitRates.length > 0) {
          return NextResponse.json({
            success: true,
            rates: mapStarshipitRatesToUiRates(starshipitRates),
          });
        }
      } catch (starshipitError: any) {
        console.error("Starshipit rates error:", starshipitError?.message);
      }
    }

    // Fallback to fixed shipping options
    const settings = await getShippingSettings();
    const rates = mapOptionsToUiRates(settings.options);

    if (rates.length === 0) {
      return NextResponse.json({
        success: true,
        rates: mapOptionsToUiRates(defaultShippingOptions.options),
      });
    }

    return NextResponse.json({
      success: true,
      rates,
    });
  } catch (error: any) {
    console.error("Shipping rates error:", error);
    return NextResponse.json({
      success: true,
      rates: mapOptionsToUiRates(defaultShippingOptions.options),
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
