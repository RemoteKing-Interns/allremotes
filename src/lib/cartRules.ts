// Carts containing an item under this price must reach a minimum merchandise
// subtotal before checkout (cheap items can't ship alone).
export const LOW_PRICE_ITEM_THRESHOLD = 10;
export const MIN_CART_SUBTOTAL = 10;

// unitPrices: per-item final unit prices; merchandiseSubtotal excludes shipping.
export const belowMinCartValue = (unitPrices: number[], merchandiseSubtotal: number) =>
  unitPrices.some((p) => p < LOW_PRICE_ITEM_THRESHOLD) && merchandiseSubtotal < MIN_CART_SUBTOTAL;
