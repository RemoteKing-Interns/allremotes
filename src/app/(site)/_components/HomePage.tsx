"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headset,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { useStore } from "../../../context/StoreContext";
import ProductCard from "../../../components/ProductCard";
import ProductImage from "../../../components/images/ProductImage";

const DEFAULT_FEEDBACK_REVIEWS = [
  {
    rating: 5,
    text: "Fast dispatch and clear compatibility notes. The remote paired in minutes.",
    author: "Daniel S.",
    verified: true,
  },
  {
    rating: 5,
    text: "Exactly what we needed for workshop reorders. Product quality is consistent.",
    author: "Mia L.",
    verified: true,
  },
  {
    rating: 4,
    text: "Good pricing and support replied quickly with programming guidance.",
    author: "Cooper R.",
    verified: true,
  },
  {
    rating: 5,
    text: "Ordered two gate remotes and both worked perfectly. Packaging was secure.",
    author: "Harper T.",
    verified: true,
  },
  {
    rating: 5,
    text: "Trade account workflow is smooth and reordering is much faster now.",
    author: "Ava K.",
    verified: true,
  },
  {
    rating: 4,
    text: "Reliable stock levels and straightforward checkout. Will buy again.",
    author: "Noah P.",
    verified: true,
  },
];

const WHY_BUY_ICON_MAP: Record<string, React.ElementType> = {
  qa: ShieldCheck,
  shieldcheck: ShieldCheck,
  shield: ShieldCheck,
  fs: Truck,
  truck: Truck,
  shipping: Truck,
  wr: RotateCcw,
  returns: RotateCcw,
  warranty: RotateCcw,
  cs: Headset,
  support: Headset,
  pm: CreditCard,
  payment: CreditCard,
  securepayments: CreditCard,
  tr: Users,
  trusted: Users,
  reviews: Star,
};

const DEFAULT_HERO_IMAGES = [
  "/images/1.jpg",
  "/images/4.png",
  "/images/5.png",
  "/images/6.png",
  "/images/7.png",
  "/images/8.png",
];

const DEFAULT_FEATURES = [
  {
    icon: "CR",
    title: "Car Remotes",
    description: "Universal and brand-specific car remotes with advanced security features",
    path: "/products/car",
  },
  {
    icon: "GG",
    title: "Garage Remotes",
    description: "Reliable garage door and gate remotes for all your home automation needs",
    path: "/products/garage",
  },
  {
    icon: "QA",
    title: "Quality Guaranteed",
    description: "All our products come with quality assurance and customer support",
    path: "/products/all",
  },
];

const DEFAULT_WHY_BUY = [
  {
    icon: "QA",
    title: "Quality Guaranteed",
    description: "Every remote is checked for fit, finish, and reliable day-to-day use before it reaches your cart.",
  },
  {
    icon: "FS",
    title: "Fast Shipping",
    description: "Responsive dispatch and clear communication for retail buyers, workshops, and trade customers.",
  },
  {
    icon: "WR",
    title: "Support That Knows Remotes",
    description: "Practical help for identifying the right model, checking compatibility, and reordering quickly.",
  },
  {
    icon: "CS",
    title: "Friendly Local Support",
    description: "Australian team ready to answer questions before and after your purchase.",
  },
];

const DEFAULT_HERO = {
  title: "Garage Door & Gate Remotes",
  subtitle: "Quality is Guaranteed",
  description: "Your trusted source for premium car and garage remotes. Browse reliable replacements and accessories.",
  primaryCta: "Shop Car Remotes",
  primaryCtaPath: "/products/car",
  secondaryCta: "Shop Garage Remotes",
  secondaryCtaPath: "/products/garage",
};

const DEFAULT_CTA = {
  title: "Ready to Find Your Perfect Remote?",
  description: "Browse our collection and find the perfect remote for your needs",
  buttonText: "View All Products",
  buttonPath: "/products/all",
};

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

function resolveWhyBuyIcon(card: any, index: number) {
  const keyFromIcon = String(card?.icon || "").toLowerCase().replace(/[^a-z]/g, "");
  const keyFromTitle = String(card?.title || "").toLowerCase().replace(/[^a-z]/g, "");
  const iconByIconKey = WHY_BUY_ICON_MAP[keyFromIcon];
  const iconByTitleKey = WHY_BUY_ICON_MAP[keyFromTitle];
  if (iconByIconKey) return iconByIconKey;
  if (iconByTitleKey) return iconByTitleKey;
  const fallbackIcons = [ShieldCheck, Truck, RotateCcw, Headset, CreditCard, Users];
  return fallbackIcons[index % fallbackIcons.length];
}

function getFeatureImage(title: string) {
  const map: Record<string, string> = {
    "Car Remotes": "https://allremotes.s3.ap-southeast-2.amazonaws.com/images/AR-RC01-1.png",
    "Garage Remotes": "https://allremotes.s3.ap-southeast-2.amazonaws.com/images/AR-RC01-1.png",
    "Quality Guaranteed": "/images/mainlogo.webp",
  };
  return map[title] || "/images/mainlogo.webp";
}

function SectionHeader({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-10 max-w-2xl lg:mb-14">
      {eyebrow && (
        <span className="mb-3 inline-block text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {body && (
        <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600">
          {body}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export default function HomePage() {
  const { getProducts, getHomeContent, getReviews } = useStore();
  const products = getProducts() || [];
  const reviews = getReviews() || [];
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const home = mounted ? getHomeContent() : null;

  const heroImages = useMemo(() => {
    const raw =
      home?.heroImages && Array.isArray(home.heroImages) && home.heroImages.length > 0
        ? home.heroImages
        : DEFAULT_HERO_IMAGES;
    return raw.filter((img: any) => img && !String(img).toLowerCase().includes("mainlogo"));
  }, [home?.heroImages]);

  useEffect(() => {
    if (!heroImages.length) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const hero = home?.hero || DEFAULT_HERO;

  const popularProducts = useMemo(() => {
    const saving = (p: any) => (Number(p?.comparePrice) || 0) - (Number(p?.price) || 0);
    const inStock = [...products].filter((p) => p?.inStock);
    const merlin = inStock
      .filter((p) => String(p?.brand).toLowerCase() === "merlin")
      .sort((a, b) => saving(b) - saving(a));
    const rest = inStock
      .filter((p) => String(p?.brand).toLowerCase() !== "merlin")
      .sort((a, b) => saving(b) - saving(a));
    return [...merlin, ...rest].slice(0, 8);
  }, [products]);

  const categories = useMemo(() => {
    const list = home?.features?.length ? home.features : DEFAULT_FEATURES;
    return list.map((f: any) => ({
      ...f,
      image: f.image || getFeatureImage(f.title),
    }));
  }, [home?.features]);

  const whyBuyItems = useMemo(() => {
    return home?.whyBuy?.length ? home.whyBuy : DEFAULT_WHY_BUY;
  }, [home?.whyBuy]);

  const feedbackReviews = useMemo(() => {
    const normalized = (reviews || [])
      .map((r: any, idx: number) => ({
        rating: Math.max(1, Math.min(5, Number(r?.rating) || 5)),
        text: String(r?.text || "").trim(),
        author: String(r?.author || "").trim() || `Customer ${idx + 1}`,
        verified: Boolean(r?.verified),
      }))
      .filter((r) => r.text);
    const next = [...normalized];
    const seen = new Set(normalized.map((r) => `${r.text}__${r.author}`.toLowerCase()));
    for (const review of DEFAULT_FEEDBACK_REVIEWS) {
      if (next.length >= 9) break;
      const key = `${review.text}__${review.author}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      next.push(review);
    }
    return next.length > 0 ? next : DEFAULT_FEEDBACK_REVIEWS;
  }, [reviews]);

  const cta = home?.ctaSection || DEFAULT_CTA;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);

  return (
    <main className="animate-fadeIn">
      {/* HERO */}
      <section className="relative min-h-[100dvh] max-h-[900px] overflow-hidden bg-neutral-900">
        {/* Background carousel */}
        <div className="absolute inset-0">
          {heroImages.map((src: string, index: number) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <ProductImage
                src={src}
                alt={hero.title || "Hero image"}
                fill
                sizes="100vw"
                loading={index === 0 ? "eager" : "lazy"}
                className="object-cover"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 via-neutral-900/70 to-neutral-900/40" />
        </div>

        {/* Content */}
        <div className="container relative z-10 flex h-full min-h-[100dvh] max-h-[900px] items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl py-24 lg:py-0">
            <motion.span
              {...fadeInUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-white/90 backdrop-blur"
            >
              <ShieldCheck size={14} strokeWidth={2} />
              {hero.subtitle || "Quality is Guaranteed"}
            </motion.span>

            <motion.h1
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.05 }}
              className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {hero.title || "Garage Door & Gate Remotes"}
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.1 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl"
            >
              {hero.description ||
                "Your trusted source for premium car and garage remotes. Browse reliable replacements and accessories."}
            </motion.p>

            <motion.div
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.15 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href={hero.primaryCtaPath || "/products/car"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.98]"
              >
                {hero.primaryCta || "Shop Car Remotes"}
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link
                href={hero.secondaryCtaPath || "/products/garage"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/15 active:scale-[0.98]"
              >
                {hero.secondaryCta || "Shop Garage Remotes"}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        {heroImages.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {heroImages.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="container grid grid-cols-1 gap-px divide-x divide-neutral-200 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Fast Shipping", body: "Australia-wide dispatch" },
            { icon: ShieldCheck, title: "12-Month Warranty", body: "On every remote" },
            { icon: Headset, title: "Local Support", body: "Real remote experts" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-center sm:text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent-dark">
                <item.icon size={22} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                <p className="text-xs text-neutral-500">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR PRODUCTS */}
      <section className="container py-16 sm:py-20 lg:py-24">
        <SectionHeader
          eyebrow="Popular Picks"
          title="The remotes customers choose first"
          body="Our most-wanted replacements and accessories, sorted by the biggest savings and fastest-moving stock."
          action={
            <Link
              href="/products/all"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-primary transition hover:text-primary-dark"
            >
              Shop all products
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          }
        />
        {popularProducts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white/70 p-8 text-sm font-semibold text-neutral-700">
            No products available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
            {popularProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* WHY BUY */}
      <section className="container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <SectionHeader
              eyebrow="Why All Remotes"
              title="Built for trade, workshops, and homeowners"
              body="We stock genuine and compatible remotes you can actually program, backed by local support and fast Australian shipping."
            />
            <Link
              href="/products/all"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.98]"
            >
              Start browsing
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {whyBuyItems.map((card: any, index: number) => {
              const Icon = resolveWhyBuyIcon(card, index);
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-neutral-200 bg-white/85 p-6 shadow-panel backdrop-blur"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent-dark">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED RANGE */}
      <section className="border-t border-neutral-200 bg-white py-16 sm:py-20 lg:py-24">
        <div className="container">
          <SectionHeader
            eyebrow="Full Range"
            title="Every remote in one place"
            body="From automotive smart keys to gate and garage openers, filter by brand, model, or frequency."
          />
          {products.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white/70 p-8 text-sm font-semibold text-neutral-700">
              No products available right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
              {products.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <Link
              href="/products/all"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.98]"
            >
              Shop All Products
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-neutral-50 py-16 sm:py-20 lg:py-24">
        <div className="container">
          <SectionHeader
            eyebrow="Reviews"
            title="Trusted by homeowners, workshops, and trade buyers"
            body="Real feedback from customers ordering replacement remotes, smart keys, and access-control products."
          />
          <div className="feedback-marquee -mx-4 mt-10 px-4" aria-live="polite">
            <div className="feedback-marquee-track flex gap-4">
              {feedbackReviews.map((r: any, i: number) => (
                <div
                  key={`${r.author}-${i}`}
                  className="w-[min(88vw,22rem)] shrink-0 pr-3 sm:w-[20rem] sm:pr-4 lg:w-[22rem]"
                >
                  <div className="rounded-2xl border border-neutral-200 bg-white/85 p-6 shadow-panel backdrop-blur">
                    <div className="text-sm font-extrabold">
                      <span className="text-primary">{"★".repeat(r.rating || 5)}</span>
                      <span className="text-neutral-300">{"☆".repeat(5 - (r.rating || 5))}</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-neutral-600">&quot;{r.text || ""}&quot;</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <strong className="text-sm font-semibold text-neutral-900">{r.author || ""}</strong>
                      {r.verified && (
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-dark">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 sm:py-20 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-900 px-6 py-14 text-center shadow-strong sm:px-12 sm:py-20 lg:py-24">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {cta.title || "Ready to Find Your Perfect Remote?"}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">
              {cta.description || "Browse our collection and find the perfect remote for your needs"}
            </p>
            <Link
              href={cta.buttonPath || "/products/all"}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.98]"
            >
              {cta.buttonText || "View All Products"}
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
