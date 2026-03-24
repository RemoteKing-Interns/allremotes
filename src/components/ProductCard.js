"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { getPriceBreakdown, isDiscountEligible } from "../utils/pricing";

function readWishlist(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

const ProductCard = ({
  product,
  onAddToCart = null,
  showWishlistButton = true,
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { getPromotions } = useStore();
  const [imageError, setImageError] = React.useState(false);
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const promotions = getPromotions();
  const pricing = getPriceBreakdown(product.price, isDiscountEligible(user), {
    promotions,
    product,
  });

  React.useEffect(() => {
    setImageError(false);
  }, [product.image]);

  const brandLabel = product.brand?.trim() || "ALLREMOTES";
  const productName =
    product.model?.trim() || product.name?.trim() || "Replacement Remote";
  const discountPercent =
    pricing.hasDiscount && pricing.originalPrice > 0
      ? Math.round((pricing.discountAmount / pricing.originalPrice) * 100)
      : 0;
  const fallbackInitial = brandLabel.charAt(0).toUpperCase();
  const userKey = React.useMemo(
    () => user?.id || user?.email || "guest",
    [user],
  );
  const wishlistKey = React.useMemo(
    () => `allremotes_wishlist_${userKey}`,
    [userKey],
  );

  React.useEffect(() => {
    if (typeof window === "undefined" || !product?.id) return;
    const wishlist = readWishlist(wishlistKey);
    setIsWishlisted(wishlist.includes(String(product.id)));
  }, [wishlistKey, product?.id]);

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!product.inStock) return;
    if (typeof onAddToCart === "function") {
      onAddToCart(product);
      return;
    }
    addToCart(product);
  };

  const toggleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof window === "undefined" || !product?.id) return;

    const id = String(product.id);
    const wishlist = readWishlist(wishlistKey);
    const next = wishlist.includes(id)
      ? wishlist.filter((item) => item !== id)
      : [id, ...wishlist];

    try {
      localStorage.setItem(wishlistKey, JSON.stringify(next));
    } catch {}

    setIsWishlisted(next.includes(id));
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white/85 shadow-panel backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-strong"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
    >
      {/* Make whole card clickable (buttons stopPropagation) */}
      <Link
        href={`/product/${product.id}`}
        aria-label={`View details for ${productName}`}
        className="absolute inset-0 z-10"
      />

      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white">
        {/* Fallback Letter */}
        {imageError && (
          <div className="text-7xl font-extrabold text-neutral-300">
            {fallbackInitial}
          </div>
        )}

        {/* Product Image */}
        {!imageError && (
          <img
            src={product.image}
            alt={productName}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-contain p-3 pt-11 transition-transform duration-300 group-hover:scale-110 sm:p-5 ${
              !product.inStock ? "opacity-50" : ""
            }`}
            onError={() => setImageError(true)}
          />
        )}

        {/* Badges - Top Left */}
        <div className="absolute left-2 top-2 right-12 z-20 flex flex-col gap-1 sm:left-3 sm:top-3 sm:right-auto sm:gap-1.5">
          {product.inStock ? (
            <span className="inline-flex max-w-full items-center gap-1.5 self-start rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-extrabold text-accent-dark sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex max-w-full items-center self-start rounded-full bg-neutral-200 px-2.5 py-1 text-[10px] font-extrabold text-neutral-600 sm:px-3 sm:py-1.5 sm:text-xs">
              Out of Stock
            </span>
          )}
          {discountPercent > 0 && (
            <span className="inline-flex max-w-full items-center self-start rounded-full bg-primary px-2.5 py-1 text-[10px] font-extrabold text-white shadow-xs sm:px-3 sm:py-1.5 sm:text-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Heart Button - Top Right */}
        {showWishlistButton && (
          <button
            type="button"
            onClick={toggleWishlist}
            className={`absolute right-2 top-2 z-30 flex h-9 w-9 items-center justify-center rounded-2xl border border-neutral-200 shadow-xs transition-all duration-200 sm:right-3 sm:top-3 sm:h-10 sm:w-10 ${
              isWishlisted
                ? "bg-white text-primary"
                : "bg-white/90 text-neutral-700 opacity-100 backdrop-blur sm:opacity-0 sm:group-hover:opacity-100"
            }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
          >
            <Heart
              size={18}
              strokeWidth={1.5}
              fill={isWishlisted ? "currentColor" : "none"}
            />
          </button>
        )}

      </div>

      {/* Product Info */}
      <div className="relative z-20 flex flex-1 flex-col p-3 sm:p-5 bg-white">
        <p className="mb-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
          {brandLabel}
        </p>
        <h3 className="mb-2 sm:mb-3 line-clamp-2 text-sm sm:text-base font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-primary-dark">
          {productName}
        </h3>
        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-neutral-900">
              AU${pricing.finalPrice.toFixed(2)}
            </span>
            {pricing.hasDiscount && (
              <span className="text-xs sm:text-sm font-semibold text-neutral-400 line-through">
                AU${pricing.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {product.inStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              className="relative z-30 inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.99] sm:w-auto sm:py-2"
            >
              <ShoppingCart size={14} strokeWidth={1.8} />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
