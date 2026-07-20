"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProductImage from "./ProductImage";
import { getProductImages, getFallbackLetter } from "@/lib/images";

interface ImageGalleryProps {
  product: any;
  className?: string;
}

/**
 * Customer-facing product image gallery.
 * Displays a main image with a thumbnail strip below.
 * Broken images are hidden from thumbnails; a fallback letter is shown when needed.
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ product, className = "" }) => {
  const images = useMemo(() => getProductImages(product), [product]);
  const fallbackLetter = useMemo(() => getFallbackLetter(product), [product]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [brokenImageIndices, setBrokenImageIndices] = useState<Set<number>>(new Set());

  // Reset whenever the image list changes (including when product data is fetched)
  useEffect(() => {
    setSelectedImageIndex(0);
    setBrokenImageIndices(new Set());
  }, [images]);

  // If the selected image is broken and another image is valid, switch to the first non-broken one
  useEffect(() => {
    if (!brokenImageIndices.has(selectedImageIndex)) return;
    const firstNonBroken = images.findIndex((_, idx) => !brokenImageIndices.has(idx));
    if (firstNonBroken >= 0) {
      setSelectedImageIndex(firstNonBroken);
    }
  }, [brokenImageIndices, images, selectedImageIndex]);

  const currentImageIndex =
    selectedImageIndex >= 0 &&
    selectedImageIndex < images.length &&
    !brokenImageIndices.has(selectedImageIndex)
      ? selectedImageIndex
      : images.findIndex((_, idx) => !brokenImageIndices.has(idx));

  const safeCurrentImageIndex =
    currentImageIndex >= 0 && currentImageIndex < images.length ? currentImageIndex : 0;
  const currentImage = images[safeCurrentImageIndex] || "";

  const handleImageLoad = (index: number) => {
    setBrokenImageIndices((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleImageError = (index: number) => {
    setBrokenImageIndices((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 rounded-2xl ${className}`}>
        <span className="text-7xl font-extrabold text-neutral-300 select-none">
          {fallbackLetter}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main Image */}
      <div className="relative flex h-[28rem] items-center justify-center overflow-hidden bg-white rounded-2xl sm:h-[34rem]">
        <ProductImage
          src={currentImage}
          alt={product?.name || "Product image"}
          fallbackLetter={fallbackLetter}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-6"
          loading="eager"
          onLoad={() => handleImageLoad(safeCurrentImageIndex)}
          onError={() => handleImageError(safeCurrentImageIndex)}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((imgUrl, idx) => {
            if (brokenImageIndices.has(idx)) return null;

            const isSelected = idx === safeCurrentImageIndex;

            return (
              <button
                key={`thumb-${idx}-${imgUrl}`}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  isSelected
                    ? "border-primary shadow-md"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <ProductImage
                  src={imgUrl}
                  alt={`${product?.name || "Product"} - image ${idx + 1}`}
                  fallbackLetter={fallbackLetter}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                  loading="lazy"
                  onLoad={() => handleImageLoad(idx)}
                  onError={() => handleImageError(idx)}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
