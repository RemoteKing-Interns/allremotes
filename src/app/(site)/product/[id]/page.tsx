"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "../../../../context/StoreContext";
import { useCart } from "../../../../context/CartContext";
import { useAuth } from "../../../../context/AuthContext";
import {
  ShoppingCart,
  ArrowLeft,
  Heart,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  getPriceBreakdown,
  isDiscountEligible,
} from "../../../../utils/pricing";
import ProductCard from "../../../../components/ProductCard";

const HARD_CODED_WARNINGS = `WARNING: This product may contain a button/coin cell battery. To reduce the risk of SERIOUS INJURY or DEATH:

Keep new and used batteries out of reach of children at all times.
Do not use this product if the battery compartment is damaged or does not close securely.
Dispose of used batteries immediately and safely - even flat batteries can still cause harm.
Do not ingest the battery. Chemical burn hazard.
Act immediately if you suspect a battery has been swallowed or inserted - severe or fatal injuries can occur within 2 hours.
Seek urgent medical attention or call:
- Australia: Poisons Information Centre on 13 11 26
- New Zealand: National Poisons Centre on 0800 764 766

Remote Pro supplies aftermarket products intended to be compatible with a wide range of original brands. Unless a product is expressly stated as genuine, all items sold on this website are aftermarket products and are not manufactured, authorised, endorsed, or approved by the original equipment manufacturers (OEMs).

Any references to brand names, trademarks, or model numbers are used only to describe compatibility or suitability with relevant equipment. Remote Pro is not affiliated with, sponsored by, or associated with these brand owners, and no OEM approval or endorsement is implied.

All trademarks, brand names, and product names remain the property of their respective owners. Remote Pro distributes a range of aftermarket products, including (but not limited to) remote controls compatible with garage and gate motors and receivers from other manufacturers, as well as substitute automotive keys, remote controls, and casings designed to be compatible with vehicles made by other manufacturers.`;

const ProductDetail = () => {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { getProducts, getPromotions } = useStore();
  const { user } = useAuth();
  const promotions = getPromotions();
  const products = getProducts() || [];
  const product = products.find((p) => p.id === id);
  const relatedProducts = products
    .filter(
      (item) => item.category === product?.category && item.id !== product?.id,
    )
    .slice(0, 4);
  const { addToCart } = useCart();
  const hasDiscount = isDiscountEligible(user);
  const pricing = getPriceBreakdown(product?.price || 0, hasDiscount, {
    promotions,
    product,
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  
  // Get images array (support both new images[] and legacy image field)
  const images = React.useMemo(() => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter((img) => String(img || "").trim() !== "");
    }
    if (product?.image) {
      return [product.image];
    }
    return [];
  }, [product?.images, product?.image]);
  
  // Get primary image index (default to imgIndex or 0)
  const primaryImageIndex = React.useMemo(() => {
    let idx = product?.imgIndex ?? 0;
    if (!Number.isFinite(idx) || idx < 0 || idx >= images.length) {
      idx = 0;
    }
    return idx;
  }, [product?.imgIndex, images.length]);
  
  // Update selected index on product change
  React.useEffect(() => {
    setSelectedImageIndex(primaryImageIndex);
  }, [product?.id, primaryImageIndex]);
  const tabSections = [
    {
      id: "description",
      label: "Description",
      content: product?.description || "No description provided.",
    },
    {
      id: "instructions",
      label: "Instructions",
      content: product?.instructions || "No instructions provided.",
    },
    {
      id: "warnings",
      label: "Warnings & Disclaimers",
      content: HARD_CODED_WARNINGS,
    },
  ];

  const userKey = useMemo(() => user?.id || user?.email || "guest", [user]);
  const wishlistKey = useMemo(
    () => `allremotes_wishlist_${userKey}`,
    [userKey],
  );
  const recentlyKey = useMemo(
    () => `allremotes_recently_viewed_${userKey}`,
    [userKey],
  );

  const readJsonArray = (key) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeJsonArray = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value || []));
    } catch {}
  };

  useEffect(() => {
    if (!product?.id) return;
    const wished = readJsonArray(wishlistKey);
    setInWishlist(wished.some((x) => String(x) === String(product.id)));
  }, [wishlistKey, product?.id]);

  useEffect(() => {
    if (!product?.id) return;
    const existing = readJsonArray(recentlyKey).map((x) => String(x));
    const next = [
      String(product.id),
      ...existing.filter((x) => x !== String(product.id)),
    ].slice(0, 12);
    writeJsonArray(recentlyKey, next);
  }, [recentlyKey, product?.id]);

  const toggleWishlist = () => {
    if (!product?.id) return;
    const existing = readJsonArray(wishlistKey).map((x) => String(x));
    const idStr = String(product.id);
    const next = existing.includes(idStr)
      ? existing.filter((x) => x !== idStr)
      : [idStr, ...existing];
    writeJsonArray(wishlistKey, next);
    setInWishlist(next.includes(idStr));
  };

  if (!product) {
    return (
      <div className="container py-12 text-center">
        <h2>Product not found</h2>
        <button onClick={() => router.push("/")} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="container py-8 sm:py-10">
        <Link
          href="/products/all"
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-100"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* LEFT: IMAGE GALLERY */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-panel"
              onMouseMove={(e) => {
                const box = e.currentTarget;
                const img = box.querySelector("img");
                if (!img) return;
                const { left, top, width, height } = box.getBoundingClientRect();
                const x = ((e.clientX - left) / width) * 100;
                const y = ((e.clientY - top) / height) * 100;
                img.style.transformOrigin = `${x}% ${y}%`;
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector("img");
                if (!img) return;
                img.style.transformOrigin = "center center";
                img.style.transform = "scale(1)";
              }}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector("img");
                if (!img) return;
                img.style.transform = "scale(2)";
              }}
            >
              <img
                key={selectedImageIndex}
                src={images[selectedImageIndex] || "/images/mainlogo.png"}
                alt={product.name}
                className="relative h-full w-full max-h-[28rem] object-contain p-6 transition-transform duration-300 will-change-transform sm:max-h-[34rem]"
                onError={(e) =>
                  (e.currentTarget.src = "/images/mainlogo.png")
                }
              />
            </div>

            {/* Thumbnail Row (only show if more than 1 image) */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      selectedImageIndex === idx
                        ? "border-primary shadow-md"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} - image ${idx + 1}`}
                      className="h-20 w-20 object-contain p-1"
                      onError={(e) =>
                        (e.currentTarget.src = "/images/mainlogo.png")
                      }
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: INFO */}
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
              {product.brand || "ALLREMOTES"}
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              {pricing.hasDiscount ? (
                <div className="flex items-baseline gap-3">
                  <p className="text-sm font-semibold text-neutral-400 line-through">
                    AU${pricing.originalPrice.toFixed(2)}
                  </p>
                  <p className="text-2xl font-extrabold tracking-tight text-neutral-900">
                    AU${pricing.finalPrice.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-extrabold tracking-tight text-neutral-900">
                  AU${pricing.finalPrice.toFixed(2)}
                </p>
              )}

              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold ${
                  product.inStock
                    ? "bg-accent/10 text-accent-dark"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {product.inStock ? <Check size={16} /> : null}
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            {/* Quantity */}
            {product.inStock && (
              <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="text-sm font-semibold text-neutral-800">Quantity</span>
                <div
                  className="flex items-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs"
                  aria-label="Product quantity selector"
                >
                  <button
                    type="button"
                    className="inline-flex h-11 w-12 items-center justify-center text-lg font-semibold text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-50"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="inline-flex h-11 w-14 items-center justify-center border-x border-neutral-200 text-sm font-extrabold text-neutral-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-11 w-12 items-center justify-center text-lg font-semibold text-neutral-800 transition hover:bg-neutral-100"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark disabled:opacity-60"
                disabled={!product.inStock}
                onClick={() => addToCart(product, quantity)}
              >
                <ShoppingCart size={18} />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </button>

              <button
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-extrabold shadow-xs transition ${
                  inWishlist
                    ? "border-primary/25 bg-primary/5 text-primary-dark hover:bg-primary/10"
                    : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
                }`}
                onClick={toggleWishlist}
              >
                <Heart size={18} />
                {inWishlist ? "In Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Specs */}
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-neutral-700">
                Product Details
              </h3>
              <ul className="mt-4 grid gap-2 text-sm text-neutral-700">
                {product.brand && (
                  <li>
                    <span className="font-semibold text-neutral-900">Brand:</span>{" "}
                    {product.brand}
                  </li>
                )}
                {product.condition && (
                  <li>
                    <span className="font-semibold text-neutral-900">Condition:</span>{" "}
                    {product.condition}
                  </li>
                )}
                {product.returns && (
                  <li>
                    <span className="font-semibold text-neutral-900">Returns:</span>{" "}
                    {product.returns}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white/80 shadow-panel backdrop-blur">
          <div className="md:hidden">
            {tabSections.map((section, index) => {
              const isOpen = activeTab === section.id;

              return (
                <div
                  key={section.id}
                  className={index > 0 ? "border-t border-neutral-200" : ""}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setActiveTab((current) =>
                        current === section.id ? "" : section.id,
                      )
                    }
                  >
                    <span
                      className={`text-sm font-extrabold uppercase tracking-[0.12em] ${
                        isOpen ? "text-accent-dark" : "text-neutral-700"
                      }`}
                    >
                      {section.label}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-neutral-500 transition-transform ${
                        isOpen ? "rotate-180 text-accent-dark" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-neutral-200 px-4 pb-4 pt-3">
                      <p
                        className={`text-sm leading-7 text-neutral-700 ${
                          section.id === "warnings" ? "whitespace-pre-line" : ""
                        }`}
                      >
                        {section.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden md:block">
            <div className="flex flex-wrap gap-2 border-b border-neutral-200 p-3">
              {tabSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`rounded-full px-4 py-2 text-xs font-extrabold tracking-[0.12em] transition ${
                    activeTab === section.id
                      ? "bg-accent/10 text-accent-dark"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                  onClick={() => setActiveTab(section.id)}
                >
                  {section.label.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-8">
              {tabSections.map(
                (section) =>
                  activeTab === section.id && (
                    <div key={section.id}>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {section.label}
                      </h3>
                      <p
                        className={`mt-3 text-sm leading-7 text-neutral-700 ${
                          section.id === "warnings" ? "whitespace-pre-line" : ""
                        }`}
                      >
                        {section.content}
                      </p>
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Related Products
              </h2>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                More {product.category === "car" ? "car" : "garage"} remotes you
                might like
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:gap-5 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
