"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getPriceBreakdown, isDiscountEligible } from '../utils/pricing';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const pricing = getPriceBreakdown(product.price, isDiscountEligible(user));

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link href={`/product/${product.id}`} className="product-card">
      <div className="product-image-container">
        <img 
          src={product.image} 
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=Remote+Control';
          }}
        />
        {!product.inStock && (
          <div className="out-of-stock-badge">Out of Stock</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-category">
          {product.category === 'car' ? '🚗 Car Remote' : '🚪 Garage Remote'}
        </p>
        <div className="product-footer">
          <div className="product-price-wrap">
            {pricing.hasDiscount && (
              <span className="product-price-original">AU${pricing.originalPrice.toFixed(2)}</span>
            )}
            <span className="product-price">AU${pricing.finalPrice.toFixed(2)}</span>
          </div>
          <button
            className="btn-add-cart"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
