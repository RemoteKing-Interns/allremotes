export const MEMBER_DISCOUNT_RATE = 0.1;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value, min, max) => {
  const n = toNumber(value);
  return Math.min(max, Math.max(min, n));
};

const roundCurrency = (value) => {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
};

const parseLocalDateStart = (dateStr) => {
  if (typeof dateStr !== "string" || !dateStr.trim()) return null;
  const [y, m, d] = dateStr.split("-").map((p) => Number(p));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const parseLocalDateEnd = (dateStr) => {
  if (typeof dateStr !== "string" || !dateStr.trim()) return null;
  const [y, m, d] = dateStr.split("-").map((p) => Number(p));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const isOfferActiveNow = (offer, now) => {
  if (!offer || !offer.enabled) return false;
  const start = parseLocalDateStart(offer.startDate);
  const end = parseLocalDateEnd(offer.endDate);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
};

const getOfferDiscountRate = ({ promotions, product, now = new Date() }) => {
  const list = promotions?.offers?.offers;
  if (!Array.isArray(list) || !product) return 0;

  let best = 0;
  for (const offer of list) {
    if (!isOfferActiveNow(offer, now)) continue;
    const appliesTo = String(offer.appliesTo || "all");
    if (appliesTo !== "all" && appliesTo !== String(product.category || "")) continue;
    const rate = clamp(offer.discountPercent, 0, 95) / 100;
    if (rate > best) best = rate;
  }
  return best;
};

export const isDiscountEligible = (user) => {
  return Boolean(user);
};

export const getDiscountedPrice = (price, userOrEligible, options = {}) => {
  const basePrice = roundCurrency(price);
  const eligible =
    typeof userOrEligible === 'boolean'
      ? userOrEligible
      : isDiscountEligible(userOrEligible);

  const memberRate = eligible ? MEMBER_DISCOUNT_RATE : 0;
  const offerRate = getOfferDiscountRate({
    promotions: options?.promotions,
    product: options?.product,
    now: options?.now,
  });
  const stack = Boolean(options?.promotions?.offers?.stackWithMemberDiscount);

  if (!memberRate && !offerRate) return basePrice;
  if (stack) return roundCurrency(basePrice * (1 - memberRate) * (1 - offerRate));
  return roundCurrency(basePrice * (1 - Math.max(memberRate, offerRate)));
};

export const getPriceBreakdown = (price, userOrEligible, options = {}) => {
  const originalPrice = roundCurrency(price);
  const finalPrice = getDiscountedPrice(originalPrice, userOrEligible, options);
  const discountAmount = roundCurrency(originalPrice - finalPrice);

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    hasDiscount: discountAmount > 0,
  };
};

export const getLineTotal = (price, quantity, userOrEligible, options = {}) => {
  const qty = Math.max(1, Math.floor(toNumber(quantity) || 1));
  return roundCurrency(getDiscountedPrice(price, userOrEligible, options) * qty);
};
