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
      className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md overflow-hidden transition-all duration-300"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {/* Fallback Letter */}
        {imageError && (
          <div className="text-7xl font-extrabold text-gray-300">
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
            className={`w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110 ${
              !product.inStock ? "opacity-50" : ""
            }`}
            onError={() => setImageError(true)}
          />
        )}

        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          {product.inStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-xs font-semibold">
              Out of Stock
            </span>
          )}
          {discountPercent > 0 && (
            <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Heart Button - Top Right */}
        <button
          type="button"
          onClick={toggleWishlist}
          className={`absolute top-3 right-3 z-30 h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${
            isWishlisted
              ? "bg-white text-red-500"
              : "bg-white/90 backdrop-blur text-gray-700 opacity-0 group-hover:opacity-100"
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
          <div className="absolute bottom-3 left-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 active:scale-95 transition-all"
            >
              <ShoppingCart size={16} strokeWidth={1.5} />
              Quick Add
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
          {brandLabel}
        </p>
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-semibold text-sm text-gray-900 leading-snug hover:text-red-500 transition-colors line-clamp-2 mb-3">
            {productName}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-gray-900 font-mono">
            ${pricing.finalPrice.toFixed(2)}
          </span>
          {pricing.hasDiscount && (
            <span className="text-sm text-gray-400 line-through font-mono">
              ${pricing.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
