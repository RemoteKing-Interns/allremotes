import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import logo from '../Images/mainlogo.png';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const { getNavigation, getProducts } = useStore();
  const navigationMenu = getNavigation();
  const products = getProducts();
  const navigate = useNavigate();
  const cartCount = getCartItemCount();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMouseEnter = (key) => {
    if (navigationMenu[key] && navigationMenu[key].columns) {
      setActiveDropdown(key);
    }
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  // Search functionality - only depend on searchQuery and getProducts (not products array, which is a new ref every render and would cause infinite loop)
  useEffect(() => {
    const list = getProducts() || [];
    if (searchQuery.trim().length > 0) {
      const filtered = list.filter(product => {
        const query = searchQuery.toLowerCase();
        return (
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.description && product.description.toLowerCase().includes(query)) ||
          (product.category && product.category.toLowerCase().includes(query))
        );
      });
      setSearchResults(filtered.slice(0, 8));
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, getProducts]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products/all?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleProductClick = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <div className="top-info-bar">
        <div className="container">
          <div className="info-items">
            <span className="info-item">12 MONTH WARRANTY</span>
            <span className="info-item">30 DAY RETURNS</span>
            <span className="info-item">SAFE & SECURE</span>
            <span className="info-item">TRADE PRICING</span>
            
            <span className="info-item">12 MONTH WARRANTY</span>
            <span className="info-item">30 DAY RETURNS</span>
            <span className="info-item">SAFE & SECURE</span>
            <span className="info-item">TRADE PRICING</span>
          </div>
        </div>
      </div>
      
      <div className="main-header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo-container">
              <img src={logo} alt="ALLREMOTES" className="logo" />
            </Link>

            <div className="search-container" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="search-form">
                <input 
                  type="text" 
                  placeholder="Search Products" 
                  className="search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                <button type="submit" className="search-submit-btn">
                  <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
              </form>
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  <div className="search-results-header">
                    <span>Search Results ({searchResults.length})</span>
                  </div>
                  <div className="search-results-list">
                    {searchResults.map(product => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="search-result-item"
                        onClick={handleProductClick}
                      >
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="search-result-image"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60x60?text=Remote';
                          }}
                        />
                        <div className="search-result-info">
                          <div className="search-result-name">{product.name}</div>
                          <div className="search-result-price">AU${product.price.toFixed(2)}</div>
                          <div className="search-result-category">
                            {product.category === 'car' ? '🚗 Car Remote' : '🚪 Garage Remote'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {searchResults.length >= 8 && (
                    <div className="search-results-footer">
                      <button 
                        type="button"
                        onClick={handleSearchSubmit}
                        className="search-view-all"
                      >
                        View All Results
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {showSearchResults && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                <div className="search-results">
                  <div className="search-no-results">
                    <p>No products found for "{searchQuery}"</p>
                    <p className="search-suggestion">Try searching for "car", "garage", or "remote"</p>
                  </div>
                </div>
              )}
            </div>

            <div className="header-actions">
              {user ? (
                <>
                  <Link to="/account" className="user-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </Link>
                  <span className="user-name">Hello, {user.name}</span>
                  <button onClick={handleLogout} className="btn btn-outline btn-small">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline btn-small">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-small">
                    Register
                  </Link>
                </>
              )}
              <Link to="/cart" className="cart-icon-new">
                <div className="cart-icon-wrapper">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  {cartCount > 0 && <span className="cart-badge-new">{cartCount}</span>}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <nav className="main-nav" ref={dropdownRef}>
        <div className="container">
          <div className="nav-inner">
            <div className="nav-links">
              {Object.keys(navigationMenu).map((key) => {
                const menuItem = navigationMenu[key];
                const isActive = activeDropdown === key;
                
                return (
                  <div
                    key={key}
                    className="nav-item-wrapper"
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={menuItem.path}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                    >
                      {menuItem.title}
                      {menuItem.columns && (
                        <svg 
                          className={`chevron ${isActive ? 'up' : 'down'}`} 
                          width="12" 
                          height="12" 
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          {isActive ? (
                            <path d="M2 8l4-4 4 4" />
                          ) : (
                            <path d="M2 4l4 4 4-4" />
                          )}
                        </svg>
                      )}
                    </Link>
                    
                    {isActive && menuItem.columns && (
                      <div className="mega-menu-wrapper">
                        <div className="mega-menu">
                          <div className="mega-menu-content">
                            {menuItem.columns.map((column, colIndex) => (
                              <div key={colIndex} className="mega-menu-column">
                                <h3 className="column-title">{column.title}</h3>
                                <ul className="column-items">
                                  {column.items.map((item, itemIndex) => (
                                    <li key={itemIndex}>
                                      <Link
                                        to={item.path}
                                        className={`menu-item-link ${item.isShopAll ? 'shop-all' : ''}`}
                                        onClick={() => setActiveDropdown(null)}
                                      >
                                        <span className="menu-item-icon">
                                          <img src={item.icon} alt={item.name} />
                                        </span>
                                        <span className="menu-item-text">{item.name}</span>
                                        {item.isShopAll && (
                                          <svg className="arrow-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 3l5 5-5 5" />
                                          </svg>
                                        )}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <Link to="/products/all" className="nav-cta">
                View Products
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
