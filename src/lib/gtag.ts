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
