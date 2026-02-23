"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";
import ProductCard from "../../components/ProductCard";
//testing commit
const Home = () => {
  const { getProducts, getHomeContent, getReviews } = useStore();
  const products = getProducts() || [];
  const home = getHomeContent();
  const reviews = getReviews() || [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = ["/images/hero.jpg", "/images/heroimg.jpg"];

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
  const featureImagesByTitle = {
    "Car Remotes": "/remotes/010_s-l500.webp",
    "Garage Remotes": "/remotes/002_s-l500.webp",
    "Quality Guaranteed": "/remotes/011_s-l500.webp",
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-slider">
          {heroImages.map((img, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
        </div>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1>{hero.title || 'Garage Door & Gate Remotes'}</h1>
            <p className="hero-subtitle">{hero.subtitle || 'Quality is Guaranteed'}</p>
            <p className="hero-description">{hero.description || ''}</p>
            <div className="hero-buttons">
              <Link
                href={hero.secondaryCtaPath || "/products/garage"}
                className="btn btn-hero-secondary"
              >
                {hero.secondaryCta || 'Shop Garage Remotes'}
              </Link>
              <Link
                href={hero.primaryCtaPath || "/products/car"}
                className="btn btn-hero-primary"
              >
                {hero.primaryCta || 'Shop Car Remotes'}
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="features">
        <div
          className="features-background"
          style={{ backgroundImage: "url(/images/heroimg.jpg)" }}
        >
          <div className="features-overlay"></div>
        </div>
        <div className="container">
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">
  {(f.image || featureImagesByTitle[f.title]) ? (
    <img
      src={f.image || featureImagesByTitle[f.title]}
      alt={f.title || 'Feature'}
    />
  ) : (
    f.icon || '✓'
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
          <h2 className="section-title">Featured Products</h2>
          <p className="section-subtitle">Browse our most popular remote controls</p>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-dark)' }}>
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
          <h2 className="section-title">Why Buy From ALLREMOTES?</h2>
          <div className="why-buy-grid">
            {whyBuy.map((b, i) => (
              <div key={i} className="why-buy-card">
                <div className="why-buy-icon">{b.icon || '✓'}</div>
                <h3>{b.title || ''}</h3>
                <p>{b.description || ''}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="container">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="section-subtitle">Real reviews from satisfied customers</p>
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

      <section
        className="cta-section"
        style={{ backgroundImage: "url(/images/heroimg2.jpg)" }}
      >
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
