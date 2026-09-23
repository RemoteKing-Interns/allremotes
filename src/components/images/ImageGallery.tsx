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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
    <div className={`flex flex-col gap-3 sm:gap-4 ${className}`}>
      {/* Main Image */}
      <button
        type="button"
        onClick={() => images.length > 0 && setLightboxOpen(true)}
        className={`relative flex h-[20rem] items-center justify-center overflow-hidden bg-white rounded-2xl sm:h-[28rem] lg:h-[34rem] ${
          images.length > 0 ? "cursor-zoom-in" : "cursor-default"
        }`}
        aria-label="Enlarge product image"
      >
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
      </button>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image enlarged"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close enlarged image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <ProductImage
              src={currentImage}
              alt={product?.name || "Product image"}
              fallbackLetter={fallbackLetter}
              fill
              sizes="(max-width: 1536px) 90vw, 90vw"
              className="object-contain"
              loading="eager"
            />
          </div>
        </div>
      )}

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
                className={`relative flex h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-20 ${
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
