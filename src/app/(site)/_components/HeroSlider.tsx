"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/images/ProductImage";

export interface HeroSlide {
  image: string;
  subtitle: string;
  title: string;
  description: string;
  primaryCta: string;
  primaryCtaPath: string;
  secondaryCta: string;
  secondaryCtaPath: string;
}

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="relative overflow-hidden border-b border-neutral-200/70">
      <div className="relative h-[500px] sm:h-[540px] lg:h-[620px]">
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <ProductImage
              key={index}
              src={slide.image}
              alt={slide.title || "Hero image"}
              fallbackSrc="/images/mainlogo.png"
              loading={index === 0 ? "eager" : "lazy"}
              fill
              sizes="100vw"
              className={`hero-slide-image object-cover transition-opacity duration-[1200ms] ease-out ${
                index === currentSlide
                  ? "hero-slide-image--active z-10 opacity-100"
                  : "z-0 opacity-0"
              }`}
              onError={() => {}}
            />
          ))}
          <div className="absolute inset-0 z-[15] bg-gradient-to-br from-neutral-900/70 via-neutral-900/60 to-neutral-800/50" />
        </div>

        <div className="container relative z-30 flex h-full items-center py-8 sm:py-10">
          <div className="relative w-full max-w-4xl min-h-[320px] sm:min-h-[360px] lg:min-h-[390px] text-left">
            {slides.map((slide, index) => (
              <div
                key={`hero-content-${index}`}
                className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  index === currentSlide
                    ? "hero-slide-content z-30 translate-y-0 opacity-100"
                    : "pointer-events-none z-0 translate-y-3 opacity-0"
                }`}
              >
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary-light backdrop-blur-sm">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {slide.subtitle}
                </div>

                {React.createElement(
                  index === 0 ? "h1" : "h2",
                  {
                    className:
                      "mt-5 max-w-3xl text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white",
                  },
                  slide.title,
                )}
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                  {slide.description}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={slide.primaryCtaPath}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-extrabold text-white shadow-soft transition-all hover:bg-primary-dark sm:w-auto"
                  >
                    {slide.primaryCta}
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href={slide.secondaryCtaPath}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/15 sm:w-auto"
                  >
                    {slide.secondaryCta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                index === currentSlide
                  ? "w-8 bg-white"
                  : "w-2 bg-white/45 hover:bg-white/70"
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
