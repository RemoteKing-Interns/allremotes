"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";
import ProductCard from "../../components/ProductCard";

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
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

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
  const categoryCount = new Set(
    (products || [])
      .map((product) => String(product?.category || "").trim())
      .filter(Boolean),
  ).size;
  const heroMetrics = [
    {
      value: products.length > 0 ? `${products.length.toLocaleString()}+` : "1,000+",
      label: "Remote Models",
    },
    {
      value: reviews.length > 0 ? `${reviews.length.toLocaleString()}+` : "1,500+",
      label: "Verified Reviews",
    },
    {
      value: categoryCount > 0 ? `${categoryCount}` : "4",
      label: "Product Lines",
    },
  ];
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
  const currentHeroSlide = heroSlides[currentSlide] || fallbackHeroSlides[0];

  return (
    <div className="animate-fadeIn">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,16,0.62),rgba(5,8,16,0.35),rgba(251,248,245,0.92))]" />

        <div className="container relative py-10 sm:py-14 lg:py-16">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] lg:gap-10">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-glass backdrop-blur-md sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/90">
                  {currentHeroSlide.subtitle}
                </p>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                  {currentHeroSlide.sideKicker}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {currentHeroSlide.title}
              </h1>
              <p className="mt-4 max-w-prose text-sm leading-7 text-white/80 sm:text-base">
                {currentHeroSlide.description}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={currentHeroSlide.primaryCtaPath}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark"
                >
                  {currentHeroSlide.primaryCta}
                </Link>
                <Link
                  href={currentHeroSlide.secondaryCtaPath}
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-extrabold text-white shadow-soft backdrop-blur hover:bg-white/15"
                >
                  {currentHeroSlide.secondaryCta}
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {heroMetrics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                  >
                    <strong className="block text-lg font-extrabold tracking-tight text-white">
                      {item.value}
                    </strong>
                    <span className="mt-1 block text-xs font-semibold text-white/75">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full border transition ${
                      index === currentSlide
                        ? "border-white bg-white"
                        : "border-white/40 bg-transparent hover:border-white/70"
                    }`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-glass backdrop-blur-md sm:p-8">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/80">
                {currentHeroSlide.sideKicker}
              </span>
              <strong className="mt-3 block text-xl font-semibold tracking-tight text-white">
                {currentHeroSlide.sideTitle}
              </strong>
              <p className="mt-3 text-sm leading-7 text-white/80">
                {currentHeroSlide.sideDescription}
              </p>

              <div className="mt-6 grid gap-4">
                {(currentHeroSlide.highlights || []).map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <div className="min-w-0">
                      <strong className="block text-sm font-semibold text-white">
                        {item.title}
                      </strong>
                      <p className="mt-1 text-sm leading-6 text-white/75">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
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
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 6).map((product) => (
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
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-sm font-extrabold text-accent-dark">
                  {String(b.icon || "AR").slice(0, 2)}
                </div>
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
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur">
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
            ))}
          </div>
      </section>

      <section className="container py-10 sm:py-14">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(251,248,245,0.88))] p-8 shadow-panel backdrop-blur sm:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {cta.title || "Ready to Find Your Perfect Remote?"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600 sm:text-base">
              {cta.description || "Browse our collection and find the perfect remote for your needs"}
            </p>
            <Link
              href={cta.buttonPath || "/products/all"}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark"
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
