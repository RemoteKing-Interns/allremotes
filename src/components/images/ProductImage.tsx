"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { S3_BUCKET_URL } from "@/lib/images";
import { batchPresign } from "@/lib/presign-batch";

interface ProductImageProps {
  src?: string;
  alt?: string;
  fallbackLetter?: string;
  fallbackSrc?: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  fill?: boolean;
  sizes?: string;
}

function isS3Url(src: string) {
  return src.startsWith(S3_BUCKET_URL);
}

function getS3Key(src: string) {
  try {
    const url = new URL(src);
    return url.pathname.replace(/^\//, "");
  } catch {
    return "";
  }
}

/**
 * Base product image component using next/image for automatic WebP/AVIF
 * optimization and resizing. Uses batch pre-signing for S3 URLs to reduce
 * HTTP requests from N to 1 per page load.
 */
const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = "Product image",
  fallbackLetter,
  fallbackSrc,
  className = "",
  loading = "lazy",
  onLoad,
  onError,
  onClick,
  fill = false,
  sizes,
}) => {
  const [error, setError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [signedSrc, setSignedSrc] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const letter = fallbackLetter?.trim() || alt?.charAt(0)?.toUpperCase() || "R";

  const onErrorRef = React.useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    setError(false);
    setFallbackError(false);
    setSignedSrc(null);
    setFetching(false);
  }, [src]);

  useEffect(() => {
    if (!src || !isS3Url(src)) {
      setSignedSrc(src || null);
      setFetching(false);
      return;
    }

    const key = getS3Key(src);
    if (!key) {
      setError(true);
      setFetching(false);
      onErrorRef.current?.();
      return;
    }

    let cancelled = false;
    setFetching(true);
    batchPresign(key).then((url) => {
      if (cancelled) return;
      if (url) {
        setSignedSrc(url);
      } else {
        setError(true);
        onErrorRef.current?.();
      }
      setFetching(false);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  const fallbackEl = (
    <div
      className={`flex items-center justify-center bg-neutral-100 ${className}`}
      onClick={onClick}
      aria-label={alt}
    >
      <span className="text-7xl font-extrabold text-neutral-300 select-none">
        {letter}
      </span>
    </div>
  );

  if (!src || error || fetching) {
    if (fallbackSrc && !fallbackError) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt}
          loading={loading}
          className={className}
          onClick={onClick}
          onLoad={onLoad}
          fill={fill}
          sizes={sizes}
          priority={loading === "eager"}
          onError={() => {
            setFallbackError(true);
            onErrorRef.current?.();
          }}
        />
      );
    }
    return fallbackEl;
  }

  const imgSrc = signedSrc || src;
  if (!imgSrc) {
    if (fallbackSrc && !fallbackError) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt}
          loading={loading}
          className={className}
          onClick={onClick}
          onLoad={onLoad}
          fill={fill}
          sizes={sizes}
          priority={loading === "eager"}
          onError={() => {
            setFallbackError(true);
            onErrorRef.current?.();
          }}
        />
      );
    }
    return fallbackEl;
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      loading={loading}
      className={className}
      onClick={onClick}
      onLoad={onLoad}
      fill={fill}
      sizes={sizes}
      priority={loading === "eager"}
      onError={() => {
        setError(true);
        onErrorRef.current?.();
      }}
    />
  );
};

export default ProductImage;
