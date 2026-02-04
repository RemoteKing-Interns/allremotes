import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById } from '../data/products';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowLeft, Heart, Check } from 'lucide-react';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const product = getProductById(id);

  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  if (!product) {
    return (
      <div className="container py-12 text-center">
        <h2>Product not found</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container py-8">

        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to Products
        </Link>

        <div className="product-grid">
          {/* LEFT: IMAGE */}
          <div
            className="product-image-box"
            onMouseMove={(e) => {
              const box = e.currentTarget;
              const img = box.querySelector("img");

              const { left, top, width, height } = box.getBoundingClientRect();
              const x = ((e.clientX - left) / width) * 100;
              const y = ((e.clientY - top) / height) * 100;

              img.style.transformOrigin = `${x}% ${y}%`;
            }}
            onMouseLeave={(e) => {
              const img = e.currentTarget.querySelector("img");
              img.style.transformOrigin = "center center";
              img.style.transform = "scale(1)";
            }}
            onMouseEnter={(e) => {
              const img = e.currentTarget.querySelector("img");
              img.style.transform = "scale(2)";
            }}
            >
            <img
              src={product.image}
              alt={product.name}
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/600x450")
              }
            />
          </div>


          {/* RIGHT: INFO */}
          <div className="product-info">
            <p className="brand">{product.brand}</p>

            <h1>{product.name}</h1>

            <div className="price-stock">
              <p className="price">AU${product.price.toFixed(2)}</p>
              {product.inStock && (
                <span className="stock">
                  <Check size={16} /> In Stock
                </span>
              )}
            </div>

          

            {/* Quantity */}
            {product.inStock && (
              <div className="quantity-box">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            )}

            {/* Buttons */}
            <button
              className="btn btn-primary full"
              disabled={!product.inStock}
              onClick={() => addToCart(product, quantity)}
            >
              <ShoppingCart size={18} />
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>

            <button
              className={`btn btn-outline full ${inWishlist ? 'active' : ''}`}
              onClick={() => setInWishlist(!inWishlist)}
            >
              <Heart size={18} />
              {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </button>

            {/* Specs */}
            <div className="specs">
              <h3>Product Details</h3>
              <ul>
                {product.brand && <li><b>Brand:</b> {product.brand}</li>}
                {product.condition && <li><b>Condition:</b> {product.condition}</li>}
                {product.location && <li><b>Location:</b> {product.location}</li>}
                {product.returns && <li><b>Returns:</b> {product.returns}</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="tabs-section">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              DESCRIPTION
            </button>
            <button
              className={`tab-btn ${activeTab === 'instructions' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructions')}
            >
              INSTRUCTIONS
            </button>
            <button
              className={`tab-btn ${activeTab === 'warnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('warnings')}
            >
              WARNINGS & DISCLAIMERS
            </button>
          </div>

          <div className="tabs-content">
            {activeTab === 'description' && (
              <div className="tab-pane">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'instructions' && (
              <div className="tab-pane">
                <h3>Instructions</h3>
                <p>{product.instructions || 'No instructions provided.'}</p>
              </div>
            )}

            {activeTab === 'warnings' && (
              <div className="tab-pane">
                <h3>Warnings & Disclaimers</h3>
                <p>{product.warnings || 'No warnings provided.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
