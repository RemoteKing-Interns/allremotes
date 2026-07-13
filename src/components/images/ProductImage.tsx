"use client";

import React, { useEffect, useState } from "react";
import { S3_BUCKET_URL } from "@/lib/images";

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
 * Base product image component.
 * Shows an image, and a neutral fallback placeholder with the provided letter
 * when the source is missing or fails to load.
 *
 * For S3 URLs, it fetches a short-lived signed URL so private objects can be
 * previewed without making the whole bucket public.
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
}) => {
  const [error, setError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [signedSrc, setSignedSrc] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const letter = fallbackLetter?.trim() || alt?.charAt(0)?.toUpperCase() || "R";

  const onErrorRef = React.useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const latestRef = React.useRef({ src: src ?? "", attempt: 0 });
  useEffect(() => {
    setAttempt(0);
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

    const current = { src: src ?? "", attempt };
    latestRef.current = current;
    setFetching(true);
    fetch(`/api/s3-presign?key=${encodeURIComponent(key)}`)
      .then((res) => res.json())
      .then((data) => {
        if (latestRef.current !== current) return;
        if (data.signedUrl) {
          setSignedSrc(data.signedUrl);
        } else {
          setError(true);
          onErrorRef.current?.();
        }
      })
      .catch(() => {
        if (latestRef.current !== current) return;
        setError(true);
        onErrorRef.current?.();
      })
      .finally(() => {
        if (latestRef.current !== current) return;
        setFetching(false);
      });
  }, [src, attempt]);

  if (!src || error || fetching) {
    if (fallbackSrc && !fallbackError) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          className={className}
          onClick={onClick}
          onLoad={onLoad}
          onError={() => {
            setFallbackError(true);
            onErrorRef.current?.();
          }}
        />
      );
    }

    return (
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
  }

  const imgSrc = signedSrc || src;
  if (!imgSrc) {
    if (fallbackSrc && !fallbackError) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          className={className}
          onClick={onClick}
          onLoad={onLoad}
          onError={() => {
            setFallbackError(true);
            onErrorRef.current?.();
          }}
        />
      );
    }

    return (
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
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onClick={onClick}
      onLoad={onLoad}
      onError={() => {
        if (src && isS3Url(src) && attempt < 2) {
          setAttempt((prev) => prev + 1);
        } else {
          setError(true);
          onErrorRef.current?.();
        }
      }}
    />
  );
};

export default ProductImage;
