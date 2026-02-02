import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../data/products';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = getProductById(id);
  const { addToCart } = useCart();

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="not-found">
            <h2>Product not found</h2>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail">
          <div className="product-detail-image">
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600x450?text=Remote+Control';
              }}
            />
          </div>
          <div className="product-detail-info">
            <span className="product-category-badge">
              {product.category === 'car' ? '🚗 Car Remote' : '🚪 Garage Remote'}
            </span>
            <h1>{product.name}</h1>
            <p className="product-price-large">AU${product.price.toFixed(2)}</p>
            <p className="product-description">{product.description}</p>
            <div className="product-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                className="btn btn-outline btn-large"
                onClick={() => navigate(-1)}
              >
                Back to Products
              </button>
            </div>
            <div className="product-specs">
              <h3>Product Details</h3>
              <div className="specs-grid">
                {product.brand && (
                  <div className="spec-item">
                    <span className="spec-label">Brand:</span>
                    <span className="spec-value">{product.brand}</span>
                  </div>
                )}
                {product.condition && (
                  <div className="spec-item">
                    <span className="spec-label">Condition:</span>
                    <span className="spec-value">{product.condition}</span>
                  </div>
                )}
                {product.location && (
                  <div className="spec-item">
                    <span className="spec-label">Location:</span>
                    <span className="spec-value">{product.location}</span>
                  </div>
                )}
                {product.returns && (
                  <div className="spec-item">
                    <span className="spec-label">Returns:</span>
                    <span className="spec-value">{product.returns}</span>
                  </div>
                )}
                {product.seller && (
                  <div className="spec-item">
                    <span className="spec-label">Seller:</span>
                    <span className="spec-value">{product.seller}</span>
                  </div>
                )}
                {product.bulkPricing && (
                  <div className="spec-item">
                    <span className="spec-label">Bulk Pricing:</span>
                    <span className="spec-value">Available</span>
                  </div>
                )}
              </div>
            </div>
            <div className="product-features">
              <h3>Features</h3>
              <ul>
                <li>Genuine product with full compatibility</li>
                <li>Long-range transmission</li>
                <li>Easy to program</li>
                <li>High-quality construction</li>
                <li>Compatible with specified systems</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
