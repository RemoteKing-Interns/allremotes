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
    <div className="home">
      <section className="hero">
        <div className="hero-slider">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-shell">
            <div className="hero-primary">
              <div className="hero-content">
                <div className="hero-copy">
                  <div className="hero-badge-row">
                    <p className="hero-subtitle">{currentHeroSlide.subtitle}</p>
                    <span className="hero-inline-chip">
                      {currentHeroSlide.sideKicker}
                    </span>
                  </div>
                  <h1>{currentHeroSlide.title}</h1>
                  <p className="hero-description">{currentHeroSlide.description}</p>
                </div>
                <div className="hero-actions">
                  <div className="hero-buttons">
                    <Link
                      href={currentHeroSlide.primaryCtaPath}
                      className="btn btn-hero-primary"
                    >
                      {currentHeroSlide.primaryCta}
                    </Link>
                    <Link
                      href={currentHeroSlide.secondaryCtaPath}
                      className="btn btn-hero-secondary"
                    >
                      {currentHeroSlide.secondaryCta}
                    </Link>
                  </div>
                  <div className="hero-metrics">
                    {heroMetrics.map((item) => (
                      <div key={item.label} className="hero-metric-card">
                        <strong>{item.value}</strong>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="hero-secondary">
              <div className="hero-secondary-card">
                <span className="hero-side-label">{currentHeroSlide.sideKicker}</span>
                <strong>{currentHeroSlide.sideTitle}</strong>
                <p>{currentHeroSlide.sideDescription}</p>
                <div className="hero-highlight-list">
                  {(currentHeroSlide.highlights || []).map((item) => (
                    <div key={item.title} className="hero-highlight-item">
                      <span className="hero-highlight-dot" />
                      <div className="hero-highlight-copy">
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
          <div className="hero-bottom-bar">
            <div className="hero-indicators hero-indicators-bottom">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-background features-background--default">
          <div className="features-overlay"></div>
        </div>
        <div className="container">
          <div className="section-intro section-intro--left">
            <span className="section-kicker">Browse By Category</span>
            <h2 className="section-title">Start with the remote type you need</h2>
            <p className="section-subtitle">
              Move through automotive, garage, gate, home, and locksmith ranges
              with clearer entry points and business-ready product organization.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">
                  {(f.image || featureImagesByTitle[f.title]) ? (
                    <img
                      src={f.image || featureImagesByTitle[f.title]}
                      alt={f.title || "Feature"}
                    />
                  ) : (
                    f.icon || "AR"
                  )}
                </div>
                <h3>{f.title || ''}</h3>
                <p>{f.description || ''}</p>
                {f.path && f.linkText && (
                  <Link href={f.path} className="feature-link">
                    {f.linkText}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="featured-products">
        <div className="container">
          <div className="section-intro featured-products-header">
            <span className="section-kicker">Best Sellers</span>
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">
              Browse our most popular remote controls across car, garage, and
              access-control categories.
            </p>
          </div>
          {products.length === 0 ? (
            <div className="section-empty">
              No products available right now.
            </div>
          ) : (
            <div className="products-grid">
              {products.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <div className="view-all-link">
            <Link href="/products/all" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      <section className="why-buy-section">
        <div className="container">
          <div className="section-intro section-intro--left">
            <span className="section-kicker">Why ALLREMOTES</span>
            <h2 className="section-title">Built for repeat orders and dependable support</h2>
            <p className="section-subtitle">
              The store is designed for straightforward product discovery,
              cleaner reorder flows, and support that understands remote keys.
            </p>
          </div>
          <div className="why-buy-grid">
            {whyBuyCards.map((b, i) => (
              <div key={i} className="why-buy-card">
                <div className="why-buy-icon">{b.icon || 'AR'}</div>
                <h3>{b.title || ''}</h3>
                <p>{b.description || ''}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="container">
          <div className="section-intro section-intro--left">
            <span className="section-kicker">Customer Feedback</span>
            <h2 className="section-title">Trusted by homeowners, workshops, and trade buyers</h2>
            <p className="section-subtitle">
              Real reviews from customers ordering replacement remotes, smart
              keys, and access-control products.
            </p>
          </div>
          <div className="reviews-grid">
            {reviews.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-rating">
                  <span>{'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}</span>
                </div>
                <p className="review-text">"{r.text || ''}"</p>
                <div className="review-author">
                  <strong>{r.author || ''}</strong>
                  {r.verified && <span>Verified Purchase</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section cta-section--default">
        <div className="cta-overlay"></div>
        <div className="container">
          <div className="cta-content">
            <h2>{cta.title || 'Ready to Find Your Perfect Remote?'}</h2>
            <p>{cta.description || 'Browse our collection and find the perfect remote for your needs'}</p>
            <Link
              href={cta.buttonPath || "/products/all"}
              className="btn btn-hero-primary btn-large"
            >
              {cta.buttonText || 'View All Products'}
            </Link>
          </div>
          
        </div>
      </section>
    </div>
  );
};

export default Home;
