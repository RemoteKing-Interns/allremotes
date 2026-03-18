"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { getPriceBreakdown, isDiscountEligible } from "../utils/pricing";
import { Button } from "./ui/button";
import styles from "./ProductCard.module.css";

const CATEGORY_LABELS = {
  car: "Automotive",
  garage: "Garage & Gate",
  "garage-gate": "Garage & Gate",
  home: "For The Home",
  "for-the-home": "For The Home",
  locksmith: "Locksmithing",
  locksmithing: "Locksmithing",
};

function getCategoryLabel(category) {
  const key = String(category || "").trim().toLowerCase();
  return CATEGORY_LABELS[key] || "Remote Control";
}

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { getPromotions } = useStore();
  const [imageError, setImageError] = React.useState(false);
  const promotions = getPromotions();
  const pricing = getPriceBreakdown(product.price, isDiscountEligible(user), {
    promotions,
    product,
  });

  React.useEffect(() => {
    setImageError(false);
  }, [product.image]);

  const categoryLabel = getCategoryLabel(product.category);
  const brandLabel = product.brand?.trim() || "ALLREMOTES";
  const productName = product.name?.trim() || `${brandLabel} Replacement Remote`;
  const skuLabel = product.sku?.trim() || brandLabel.toUpperCase();
  const detailLabel = `${brandLabel} ${categoryLabel}`;
  const footerMeta = product.condition?.trim() || detailLabel;
  const savingsCopy = pricing.hasDiscount
    ? `Save AU$${pricing.discountAmount.toFixed(2)}`
    : "";

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product);
  };

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      whileHover={{ y: -6 }}
    >
      <Link
        href={`/product/${product.id}`}
        className={styles.link}
        aria-label={`View ${productName}`}
      >
        <div className={styles.mediaStage}>
          <div className={styles.mediaHeader}>
            <span className={styles.categoryTag}>{categoryLabel}</span>
          </div>

          <div className={styles.imageWrap}>
            <div className={styles.imageGlow} />
            {imageError ? (
              <div className={styles.fallback}>
                <div className={styles.fallbackIcon}>
                  <ImageOff size={24} strokeWidth={2.1} />
                </div>
                <p className={styles.fallbackTitle}>Image coming soon</p>
              </div>
            ) : (
              <img
                src={product.image}
                alt={productName}
                loading="lazy"
                decoding="async"
                className={`${styles.productImage} ${
                  product.inStock ? "" : styles.productImageMuted
                }`}
                onError={() => {
                  setImageError(true);
                }}
              />
            )}
          </div>
        </div>

        <div className={styles.body}>
          <p className={styles.eyebrow}>{skuLabel}</p>
          <h3 className={styles.title}>{productName}</h3>
          <p className={styles.detail}>{detailLabel}</p>
        </div>
      </Link>

      <div className={styles.footer}>
        <div className={styles.footerShell}>
          <div className={styles.footerHeader}>
            <div className={styles.footerPriceBlock}>
              {pricing.hasDiscount && (
                <span className={styles.originalPrice}>
                  AU${pricing.originalPrice.toFixed(2)}
                </span>
              )}
              <div className={styles.footerPriceLine}>
                <span className={styles.finalPrice}>
                  AU${pricing.finalPrice.toFixed(2)}
                </span>
                {pricing.hasDiscount && (
                  <span className={styles.offerPill}>{savingsCopy}</span>
                )}
              </div>
            </div>

            <span
              className={`${styles.footerStock} ${
                product.inStock ? styles.footerStockIn : styles.footerStockOut
              }`}
            >
              <span className={styles.footerStockDot} />
              {product.inStock ? "In stock" : "Sold out"}
            </span>
          </div>

          <div className={styles.footerMetaRow}>
            <span className={styles.footerMetaPill}>{skuLabel}</span>
            <span className={styles.footerMetaText}>{footerMeta}</span>
          </div>

          <div className={styles.footerActionRow}>
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              size="sm"
              variant={product.inStock ? "secondary" : "outline"}
              className={styles.actionButton}
            >
              {product.inStock ? "Add to Cart" : "Unavailable"}
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
