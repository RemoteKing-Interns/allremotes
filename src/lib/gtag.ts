const GOOGLE_ADS_ID = "AW-18410791303";

// Conversion action label from Google Ads (Goals > Conversions > purchase action
// details, the part after the slash in "AW-XXXXXXXXX/LABEL"). Without it the
// purchase conversion cannot be attributed, so we skip firing it entirely.
const GOOGLE_ADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || "";

type GtagEvent = {
  event: string;
  [key: string]: any;
};

export function trackGtagEvent(payload: GtagEvent) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("event", payload.event, payload);
  }
}

// Meta pixel — same helper shape; fires only when fbevents.js is loaded
export function trackFbEvent(event: string, payload: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (typeof w.fbq === "function") {
    w.fbq("track", event, payload);
  }
}

export function trackSearch(searchTerm: string, resultCount: number) {
  trackGtagEvent({
    event: "search",
    search_term: searchTerm,
    results_count: resultCount,
  });
  trackFbEvent("Search", { search_string: searchTerm });
}

export function trackViewItem(product: { id: string; name: string; price: number; category?: string }) {
  trackGtagEvent({
    event: "view_item",
    currency: "AUD",
    value: product.price || 0,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category || "",
      },
    ],
  });
  trackFbEvent("ViewContent", {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: "product",
    value: product.price || 0,
    currency: "AUD",
  });
}

export function trackAddToCart(product: { id: string; name: string; price: number; quantity: number; category?: string }) {
  trackGtagEvent({
    event: "add_to_cart",
    currency: "AUD",
    value: (product.price || 0) * (product.quantity || 1),
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
        item_category: product.category || "",
      },
    ],
  });
  trackFbEvent("AddToCart", {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: "product",
    value: (product.price || 0) * (product.quantity || 1),
    currency: "AUD",
  });
}

export function trackBeginCheckout(value: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
  trackGtagEvent({
    event: "begin_checkout",
    currency: "AUD",
    value,
    items: items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });
  trackFbEvent("InitiateCheckout", {
    content_ids: items.map((i) => String(i.id)),
    content_type: "product",
    num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
    value,
    currency: "AUD",
  });
}

export function trackPurchase(orderId: string, value: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
  trackGtagEvent({
    event: "purchase",
    transaction_id: orderId,
    currency: "AUD",
    value,
    items: items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });
  trackFbEvent("Purchase", {
    content_ids: items.map((i) => String(i.id)),
    content_type: "product",
    num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
    value,
    currency: "AUD",
  });

  // Google Ads conversion event — only when a conversion label is configured
  if (GOOGLE_ADS_PURCHASE_LABEL) {
    trackGtagEvent({
      event: "conversion",
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      value,
      currency: "AUD",
      transaction_id: orderId,
    });
  } else if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn("Google Ads purchase conversion skipped: NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL is not set");
  }
}
