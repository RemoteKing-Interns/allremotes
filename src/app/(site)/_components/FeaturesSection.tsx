"use client";

import Link from "next/link";
import ProductImage from "@/components/images/ProductImage";

export interface Feature {
  title?: string;
  description?: string;
  icon?: string;
  image?: string;
  path?: string;
  linkText?: string;
}

const FEATURE_IMAGES_BY_TITLE: Record<string, string> = {
  "Car Remotes": "https://allremotes.s3.ap-southeast-2.amazonaws.com/images/AR-RC01-1.png",
  "Garage Remotes": "https://allremotes.s3.ap-southeast-2.amazonaws.com/images/AR-RC01-1.png",
  "Quality Guaranteed": "/images/mainlogo.webp",
};

export default function FeaturesSection({ features }: { features: Feature[] }) {
  if (!features || features.length === 0) return null;

  return (
    <section className="container py-10 sm:py-14">
      <div className="grid gap-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Start with the remote type you need
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
            Move through automotive, garage, gate, home, and locksmith ranges
            with clearer entry points and business-ready product organization.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 shadow-xs">
                  {f.image || FEATURE_IMAGES_BY_TITLE[f.title || ""] ? (
                    <ProductImage
                      src={f.image || FEATURE_IMAGES_BY_TITLE[f.title || ""]}
                      alt={f.title || "Feature"}
                      fallbackSrc="/images/mainlogo.png"
                      fallbackLetter={String(f.title || "AR").slice(0, 2)}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-sm font-extrabold text-accent-dark">
                      {String(f.icon || "AR").slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900">
                    {f.title || ""}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    {f.description || ""}
                  </p>
                </div>
              </div>
              {f.path && f.linkText && (
                <Link
                  href={f.path}
                  className="mt-5 inline-flex text-sm font-semibold text-accent-dark hover:text-accent"
                >
                  {f.linkText}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
