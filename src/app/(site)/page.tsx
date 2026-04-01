"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Headset,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import ProductCard from "../../components/ProductCard";

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

const WHY_BUY_ICON_MAP = {
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

const Home = () => {
  const { getProducts, getHomeContent, getReviews } = useStore();
  const products = getProducts() || [];
  const home = getHomeContent();
  const reviews = getReviews() || [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = (home?.heroImages && Array.isArray(home.heroImages) && home.heroImages.length > 0)
    ? home.heroImages
    : ["/images/hero.jpg", "/images/heroimg.jpg"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const feedbackReviews = React.useMemo(() => {
    const normalized = (reviews || []).map((r, idx) => ({
      rating: Math.max(1, Math.min(5, Number(r?.rating) || 5)),
      text: String(r?.text || "").trim(),
      author: String(r?.author || "").trim() || `Customer ${idx + 1}`,
      verified: Boolean(r?.verified),
    })).filter((r) => r.text);

    const next = [...normalized];
    const seen = new Set(
      normalized.map((r) => `${r.text}__${r.author}`.toLowerCase()),
    );

    for (const review of DEFAULT_FEEDBACK_REVIEWS) {
      if (next.length >= 9) break;
      const key = `${review.text}__${review.author}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      next.push(review);
    }

    return next.length > 0 ? next : DEFAULT_FEEDBACK_REVIEWS;
  }, [reviews]);

  const feedbackMarqueeReviews = React.useMemo(() => {
    const base = feedbackReviews.length > 0 ? feedbackReviews : DEFAULT_FEEDBACK_REVIEWS;
    return [...base, ...base];
  }, [feedbackReviews]);

  const hero = home?.hero || {};
  const features = home?.features || [];
  const whyBuy = home?.whyBuy || [];
  const cta = home?.ctaSection || {};
  const defaultWhyBuy = [
    {
      title: "Quality Guaranteed",
      description:
        "Every remote is checked for fit, finish, and reliable day-to-day use before it reaches your cart.",
    },
    {
      title: "Fast Shipping",
      description:
        "Responsive dispatch and clear communication for retail buyers, workshops, and trade customers.",
    },
    {
      title: "Support That Knows Remotes",
      description:
        "Practical help for identifying the right model, checking compatibility, and reordering quickly.",
    },
  ];
  const whyBuyCards = whyBuy.length > 0 ? whyBuy : defaultWhyBuy;
  const heroReasons = whyBuyCards.slice(0, 3);
  const heroLeadReason = heroReasons[0] || defaultWhyBuy[0];
  const heroSideReasons = heroReasons.slice(1);
  const carProductsCount = products.filter((product) => product?.category === "car").length;
  const garageProductsCount = products.filter((product) => product?.category === "garage").length;
  const featureImagesByTitle = {
    "Car Remotes": "/remotes/010_s-l500.webp",
    "Garage Remotes": "/remotes/002_s-l500.webp",
    "Quality Guaranteed": "/remotes/011_s-l500.webp",
  };
  const defaultHeroHighlights = [
    heroSideReasons[0] || {
      title: "Fast Shipping",
      description: "Responsive dispatch and practical support for trade and retail buyers.",
    },
    heroSideReasons[1] || {
      title: "Support That Knows Remotes",
      description: "Practical guidance for matching remotes, keys, and compatible accessories.",
    },
  ];
  const configuredHeroSlides = Array.isArray(home?.heroSlides) ? home.heroSlides : [];
  const fallbackHeroSlides = [
    {
      subtitle: hero.subtitle || "Quality is Guaranteed",
      title: hero.title || "Garage Door & Gate Remotes",
      description:
        hero.description ||
        "Your trusted source for premium car and garage remotes. Browse reliable replacements, accessories, and business-ready service support.",
      primaryCta: hero.primaryCta || "Shop Car Remotes",
      primaryCtaPath: hero.primaryCtaPath || "/products/car",
      secondaryCta: hero.secondaryCta || "Shop Garage Remotes",
      secondaryCtaPath: hero.secondaryCtaPath || "/products/garage",
      sideKicker: "Business-grade service",
      sideTitle: heroLeadReason.title,
      sideDescription: heroLeadReason.description,
      highlights: defaultHeroHighlights,
    },
    {
      subtitle: "Automotive remote keys",
      title: "Replacement Car Keys & Smart Remotes",
      description:
        (carProductsCount > 0
          ? `Browse ${carProductsCount}+ automotive remote options across smart keys, shells, and replacement key solutions.`
          : "Browse automotive remote options across smart keys, shells, and replacement key solutions.") +
        " Built for clean fitment, dependable day-to-day use, and fast reordering.",
      primaryCta: "Shop Automotive",
      primaryCtaPath: "/products/car",
      secondaryCta: "View All Products",
      secondaryCtaPath: "/products/all",
      sideKicker: "Automotive focus",
      sideTitle: "Vehicle-ready replacements",
      sideDescription:
        "Find the right remote key solution faster with a catalog focused on popular automotive formats and dependable stock.",
      highlights: [
        {
          title: "Fitment-first range",
          description: "Organized for faster browsing across common vehicle remote and smart key styles.",
        },
        {
          title: "Clearer buying path",
          description: "Category-led navigation helps retail buyers and workshops locate automotive options quickly.",
        },
      ],
    },
    {
      subtitle: "Garage & gate access",
      title: "Garage, Gate & Access Remotes",
      description:
        (garageProductsCount > 0
          ? `Explore ${garageProductsCount}+ garage and gate remote options for home, building, and access automation needs.`
          : "Explore garage and gate remote options for home, building, and access automation needs.") +
        " A practical range backed by responsive support and reliable fulfilment.",
      primaryCta: "Shop Garage & Gate",
      primaryCtaPath: "/products/garage",
      secondaryCta: "Browse Best Sellers",
      secondaryCtaPath: "/products/all",
      sideKicker: "Access control range",
      sideTitle: "Reliable everyday control",
      sideDescription:
        "From household remotes to trade supply, the garage and gate range is designed for clean selection and repeat ordering.",
      highlights: [
        {
          title: "Home and trade ready",
          description: "Suitable for homeowners, installers, locksmiths, and repeat trade customers.",
        },
        {
          title: "Support beyond checkout",
          description: "Get help with product identification, reordering, and general remote selection.",
        },
      ],
    },
  ];

  const resolveWhyBuyIcon = (card, index) => {
    const keyFromIcon = String(card?.icon || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const keyFromTitle = String(card?.title || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const iconByIconKey = WHY_BUY_ICON_MAP[keyFromIcon];
    const iconByTitleKey = WHY_BUY_ICON_MAP[keyFromTitle];

    if (iconByIconKey) return iconByIconKey;
    if (iconByTitleKey) return iconByTitleKey;

    const fallbackIcons = [ShieldCheck, Truck, RotateCcw, Headset, CreditCard, Users];
    return fallbackIcons[index % fallbackIcons.length];
  };
  const heroSlides = heroImages.map((image, index) => {
    const fallback = fallbackHeroSlides[index % fallbackHeroSlides.length];
    const configured = configuredHeroSlides[index] || {};
    const configuredHighlights = Array.isArray(configured.highlights) && configured.highlights.length > 0
      ? configured.highlights.slice(0, 2)
      : fallback.highlights;

    return {
      image,
      ...fallback,
      ...configured,
      highlights: configuredHighlights,
    };
  });
  return (
    <div className="animate-fadeIn">
      <section className="relative overflow-hidden border-b border-neutral-200/70">
        <div className="relative h-[500px] sm:h-[540px] lg:h-[620px]">
          <div className="absolute inset-0">
            {heroSlides.map((slide, index) => (
              <img
                key={index}
                src={slide.image}
                alt=""
                className={`hero-slide-image absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
                  index === currentSlide
                    ? "hero-slide-image--active opacity-100"
                    : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/92 via-neutral-900/72 to-neutral-900/46" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.18),transparent_42%)]" />
          </div>

          <div className="container relative z-10 flex h-full items-center py-8 sm:py-10">
            <div className="relative w-full max-w-4xl min-h-[320px] sm:min-h-[360px] lg:min-h-[390px]">
              {heroSlides.map((slide, index) => (
                <div
                  key={`hero-content-${index}`}
                  className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    index === currentSlide
                      ? "hero-slide-content translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-3 opacity-0"
                  }`}
                >
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/35 bg-accent/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-accent-light backdrop-blur-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {slide.subtitle}
                  </div>

                  <h1 className="mt-5 max-w-3xl text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
                    {slide.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                    {slide.description}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      href={slide.primaryCtaPath}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-extrabold text-white shadow-soft transition-all hover:bg-primary-dark sm:w-auto"
                    >
                      {slide.primaryCta}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            {heroImages.map((_, index) => (
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

      <section className="container py-10 sm:py-14">
        <div className="grid gap-10">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
              Browse By Category
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Start with the remote type you need
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
              Move through automotive, garage, gate, home, and locksmith ranges
              with clearer entry points and business-ready product organization.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 shadow-xs">
                  {(f.image || featureImagesByTitle[f.title]) ? (
                    <img
                      src={f.image || featureImagesByTitle[f.title]}
                      alt={f.title || "Feature"}
                      className="h-10 w-10 object-contain"
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
                  <Link href={f.path} className="mt-5 inline-flex text-sm font-semibold text-accent-dark hover:text-accent">
                    {f.linkText}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <div className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-dark">
            Best Sellers
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Featured Products
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
              Browse our most popular remote controls across car, garage, and
              access-control categories.
          </p>
        </div>
          {products.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/70 p-6 text-sm font-semibold text-neutral-700">
              No products available right now.
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <div className="mt-8">
            <Link href="/products/all" className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark">
              View All Products
            </Link>
          </div>
      </section>

      <section className="container py-10 sm:py-14">
        <div className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
            Why ALLREMOTES
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Built for repeat orders and dependable support
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
              The store is designed for straightforward product discovery,
              cleaner reorder flows, and support that understands remote keys.
          </p>
        </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyBuyCards.map((b, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur">
                {(() => {
                  const WhyBuyIcon = resolveWhyBuyIcon(b, i);
                  return (
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent-dark">
                      <WhyBuyIcon size={22} strokeWidth={2.1} />
                    </div>
                  );
                })()}
                <h3 className="text-base font-semibold text-neutral-900">{b.title || ""}</h3>
                <p className="mt-2 text-sm leading-7 text-neutral-600">{b.description || ""}</p>
              </div>
            ))}
          </div>
      </section>

      <section className="container py-10 sm:py-14">
        <div className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-dark">
            Customer Feedback
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Trusted by homeowners, workshops, and trade buyers
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
              Real reviews from customers ordering replacement remotes, smart
              keys, and access-control products.
          </p>
        </div>
          <div className="feedback-marquee mt-8" aria-live="polite">
            <div className="feedback-marquee-track">
              {feedbackMarqueeReviews.map((r, i) => (
                <div
                  key={`${r.author}-${i}`}
                  aria-hidden={i >= feedbackMarqueeReviews.length / 2}
                  className="w-[min(88vw,22rem)] shrink-0 pr-3 sm:w-[20rem] sm:pr-4 lg:w-[22rem]"
                >
                  <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                    <div className="text-sm font-extrabold text-gold">
                      <span className="text-primary">{'★'.repeat(r.rating || 5)}</span>
                      <span className="text-neutral-300">{'☆'.repeat(5 - (r.rating || 5))}</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-neutral-700">&quot;{r.text || ""}&quot;</p>
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
      </section>

      <section className="container py-10 sm:py-14">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(130%_120%_at_2%_0%,rgba(26,122,110,0.30)_0%,rgba(26,122,110,0.10)_40%,transparent_68%),radial-gradient(110%_120%_at_100%_4%,rgba(192,57,43,0.24)_0%,rgba(192,57,43,0.08)_46%,transparent_74%),linear-gradient(102deg,rgba(26,122,110,0.14)_0%,rgba(60,150,151,0.12)_52%,rgba(192,57,43,0.14)_100%)] p-8 shadow-panel backdrop-blur sm:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {cta.title || "Ready to Find Your Perfect Remote?"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600 sm:text-base">
              {cta.description || "Browse our collection and find the perfect remote for your needs"}
            </p>
            <Link
              href={cta.buttonPath || "/products/all"}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark sm:w-auto"
            >
              {cta.buttonText || "View All Products"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
