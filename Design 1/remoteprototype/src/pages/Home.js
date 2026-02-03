import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';
import ProductCard from '../components/ProductCard';
// import CarFinder from '../components/CarFinder.js';
import heroImage from '../Images/hero.jpg';
import heroImg1 from '../Images/heroimg.jpg';
import heroImg2 from '../Images/heroimg2.jpg';
import './Home.css';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = [heroImage, heroImg1];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [heroImages.length]);

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
            <h1>Garage Door & Gate Remotes</h1>
            <p className="hero-subtitle">Quality is Guaranteed</p>
            <p className="hero-description">
              Your trusted source for premium car and garage remotes. 
              Browse our extensive collection of high-quality remote controls 
              designed to meet all your automation needs.
            </p>
            <div className="hero-buttons">
              <Link to="/products/garage" className="btn btn-hero-secondary">
                Shop Garage Remotes
              </Link>
              <Link to="/products/car" className="btn btn-hero-primary">
                Shop Car Remotes
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

      {/* <CarFinder /> */}

      <section className="features">
        <div className="features-background" style={{ backgroundImage: `url(${heroImg1})` }}>
          <div className="features-overlay"></div>
        </div>
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚗</div>
              <h3>Car Remotes</h3>
              <p>Universal and brand-specific car remotes with advanced security features</p>
              <Link to="/products/car" className="feature-link">
                Explore →
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚪</div>
              <h3>Garage Remotes</h3>
              <p>Reliable garage door and gate remotes for all your home automation needs</p>
              <Link to="/products/garage" className="feature-link">
                Explore →
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✓</div>
              <h3>Quality Guaranteed</h3>
              <p>All our products come with quality assurance and customer support</p>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          <p className="section-subtitle">Browse our most popular remote controls</p>
          <div className="products-grid">
            {products.slice(0, 6).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="view-all-link">
            <Link to="/products/all" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      <section className="why-buy-section">
        <div className="container">
          <h2 className="section-title">Why Buy From ALLREMOTES?</h2>
          <div className="why-buy-grid">
            <div className="why-buy-card">
              <div className="why-buy-icon">✓</div>
              <h3>Quality Guaranteed</h3>
              <p>All our products are genuine and come with quality assurance. We stand behind every product we sell.</p>
            </div>
            <div className="why-buy-card">
              <div className="why-buy-icon">🚚</div>
              <h3>Free Shipping Australia Wide</h3>
              <p>We offer free shipping on all non-bulky items across Australia. Fast and reliable delivery.</p>
            </div>
            <div className="why-buy-card">
              <div className="why-buy-icon">🔄</div>
              <h3>30 Day Returns & 12 Month Warranty</h3>
              <p>All purchases include a 30-day return option and 12-month warranty for your peace of mind.</p>
            </div>
            <div className="why-buy-card">
              <div className="why-buy-icon">💬</div>
              <h3>Unbeatable Support</h3>
              <p>Friendly, reliable support you can trust. Our experienced team is ready to help via phone, email, or live chat.</p>
            </div>
            <div className="why-buy-card">
              <div className="why-buy-icon">🔒</div>
              <h3>Secure Payments</h3>
              <p>Mastercard, VISA, AMEX, Bank Deposit, Afterpay - All payment options are surcharge-free and secure.</p>
            </div>
            <div className="why-buy-card">
              <div className="why-buy-icon">⭐</div>
              <h3>Trusted by Thousands</h3>
              <p>Over 1,500 five-star reviews and trusted by homeowners, tradespeople, and businesses across Australia.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="container">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="section-subtitle">Real reviews from satisfied customers</p>
          <div className="reviews-grid">
            <div className="review-card">
              <div className="review-rating">
                <span>★★★★★</span>
              </div>
              <p className="review-text">
                "Excellent service and fast delivery! The remote I ordered worked perfectly with my garage door. Highly recommend ALLREMOTES!"
              </p>
              <div className="review-author">
                <strong>John M.</strong>
                <span>Verified Purchase</span>
              </div>
            </div>
            <div className="review-card">
              <div className="review-rating">
                <span>★★★★★</span>
              </div>
              <p className="review-text">
                "Great quality products at competitive prices. The customer support team was very helpful in finding the right remote for my car."
              </p>
              <div className="review-author">
                <strong>Sarah K.</strong>
                <span>Verified Purchase</span>
              </div>
            </div>
            <div className="review-card">
              <div className="review-rating">
                <span>★★★★★</span>
              </div>
              <p className="review-text">
                "Quick shipping and the product was exactly as described. Easy to program and works great. Will definitely shop here again!"
              </p>
              <div className="review-author">
                <strong>Michael T.</strong>
                <span>Verified Purchase</span>
              </div>
            </div>
            <div className="review-card">
              <div className="review-rating">
                <span>★★★★★</span>
              </div>
              <p className="review-text">
                "Best place to buy remotes online! Wide selection, genuine products, and excellent customer service. 5 stars!"
              </p>
              <div className="review-author">
                <strong>Emma L.</strong>
                <span>Verified Purchase</span>
              </div>
            </div>
            <div className="review-card">
              <div className="review-rating">
                <span>★★★★★</span>
              </div>
              <p className="review-text">
                "Professional service and high-quality remotes. The warranty gives me confidence in my purchase. Thank you!"
              </p>
              <div className="review-author">
                <strong>David R.</strong>
                <span>Verified Purchase</span>
              </div>
            </div>
            <div className="review-card">
              <div className="review-rating">
                <span>★★★★★</span>
              </div>
              <p className="review-text">
                "Fast delivery, great prices, and the remote works perfectly. The free shipping is a huge bonus. Highly satisfied!"
              </p>
              <div className="review-author">
                <strong>Lisa W.</strong>
                <span>Verified Purchase</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section" style={{ backgroundImage: `url(${heroImg2})` }}>
        <div className="cta-overlay"></div>
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Find Your Perfect Remote?</h2>
            <p>Browse our collection and find the perfect remote for your needs</p>
            <Link to="/products/all" className="btn btn-hero-primary btn-large">
              View All Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
