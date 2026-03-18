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

const ProductCard = ({ product, onAddToCart = null }) => {
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
    product.name?.trim() || `${brandLabel} Replacement Remote`;
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
      className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/85 shadow-panel backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-strong"
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

      {/* Image Container */}
      <div className="relative aspect-square bg-neutral-100/80 flex items-center justify-center overflow-hidden">
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
            className={`w-full h-full object-contain p-5 transition-transform duration-300 group-hover:scale-110 ${
              !product.inStock ? "opacity-50" : ""
            }`}
            onError={() => setImageError(true)}
          />
        )}

        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          {product.inStock ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-neutral-200 px-3 py-1.5 text-xs font-extrabold text-neutral-600">
              Out of Stock
            </span>
          )}
          {discountPercent > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Heart Button - Top Right */}
        <button
          type="button"
          onClick={toggleWishlist}
          className={`absolute top-3 right-3 z-30 flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 shadow-xs transition-all duration-200 ${
            isWishlisted
              ? "bg-white text-primary"
              : "bg-white/90 backdrop-blur text-neutral-700 opacity-0 group-hover:opacity-100"
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

        {/* Quick Add Button - Bottom */}
        {product.inStock && (
          <div className="absolute bottom-3 left-3 right-3 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleAddToCart}
              className="relative z-20 w-full rounded-2xl bg-primary py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.99]"
            >
              <ShoppingCart size={16} strokeWidth={1.5} />
              Quick Add
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="relative z-20 p-5">
        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
          {brandLabel}
        </p>
        <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-primary-dark">
          {productName}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold tracking-tight text-neutral-900">
            AU${pricing.finalPrice.toFixed(2)}
          </span>
          {pricing.hasDiscount && (
            <span className="text-sm font-semibold text-neutral-400 line-through">
              AU${pricing.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
