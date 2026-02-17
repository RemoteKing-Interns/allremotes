export const MEMBER_DISCOUNT_RATE = 0.1;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value) => {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
};

export const isDiscountEligible = (user) => {
  return Boolean(user);
};

export const getDiscountedPrice = (price, userOrEligible) => {
  const basePrice = roundCurrency(price);
  const eligible =
    typeof userOrEligible === 'boolean'
      ? userOrEligible
      : isDiscountEligible(userOrEligible);

  if (!eligible) return basePrice;
  return roundCurrency(basePrice * (1 - MEMBER_DISCOUNT_RATE));
};

export const getPriceBreakdown = (price, userOrEligible) => {
  const originalPrice = roundCurrency(price);
  const finalPrice = getDiscountedPrice(originalPrice, userOrEligible);
  const discountAmount = roundCurrency(originalPrice - finalPrice);

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    hasDiscount: discountAmount > 0,
  };
};

export const getLineTotal = (price, quantity, userOrEligible) => {
  const qty = Math.max(1, Math.floor(toNumber(quantity) || 1));
  return roundCurrency(getDiscountedPrice(price, userOrEligible) * qty);
};
