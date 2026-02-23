import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../ProductCard';
import './AccountSection.css';

const PreferencesSaved = () => {
  const { getProducts } = useStore();
  const products = getProducts() || [];
  const [wishlist] = useState([
    products[0],
    products[2],
    products[6]
  ].filter(Boolean));

  const [recentlyViewed] = useState([
    products[1],
    products[5],
    products[7]
  ].filter(Boolean));

  const [savedSearches] = useState([
    { id: 1, query: 'garage remote', count: 12 },
    { id: 2, query: 'car key fob', count: 8 },
    { id: 3, query: 'smart remote', count: 5 }
  ]);

  return (
    <div className="account-section">
      <h2>Preferences & Saved Items</h2>
      
      <div className="section-content">
        <div className="wishlist-section">
          <div className="section-header">
            <h3>Wishlist / Favorites</h3>
            <Link to="/products/all" className="btn btn-gradient btn-small">
              Browse More
            </Link>
          </div>
          
          {wishlist.length === 0 ? (
            <div className="empty-state">
              <p>Your wishlist is empty</p>
              <Link to="/products/all" className="btn btn-gradient">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="products-grid-mini">
              {wishlist.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <div className="section-divider"></div>

        <div className="recently-viewed-section">
          <h3>Recently Viewed Items</h3>
          
          {recentlyViewed.length === 0 ? (
            <div className="empty-state">
              <p>No recently viewed items</p>
            </div>
          ) : (
            <div className="products-grid-mini">
              {recentlyViewed.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <div className="section-divider"></div>

        <div className="saved-searches-section">
          <h3>Saved Searches</h3>
          
          {savedSearches.length === 0 ? (
            <div className="empty-state">
              <p>No saved searches</p>
            </div>
          ) : (
            <div className="searches-list">
              {savedSearches.map(search => (
                <div key={search.id} className="search-item">
                  <div>
                    <Link to={`/products/all?search=${search.query}`} className="search-query">
                      "{search.query}"
                    </Link>
                    <p className="search-count">{search.count} products found</p>
                  </div>
                  <button className="btn btn-outline-red btn-small">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferencesSaved;
