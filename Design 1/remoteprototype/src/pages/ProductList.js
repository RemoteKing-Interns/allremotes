import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import './ProductList.css';

const PAGE_SIZE = 15;

const ProductList = () => {
  const { getProducts } = useStore();
  const { addToCart } = useCart();
  const products = getProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [addedItem, setAddedItem] = useState(null);
  const isModalOpen = Boolean(addedItem);

  const pageFromUrl = Number(searchParams.get('page') || '1');
  const [currentPage, setCurrentPage] = useState(Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1);

  const brands = useMemo(() => {
    return ['all', ...new Set((products || []).map(p => p.brand).filter(Boolean))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = selectedCategory === 'all' ? (products || []) : (products || []).filter(p => p.category === selectedCategory);

    if (selectedBrand !== 'all') {
      result = result.filter(p => p.brand === selectedBrand);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, selectedCategory, selectedBrand, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  }, [filteredProducts.length]);

  const clampedPage = useMemo(() => {
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, totalPages]);

  const pageProducts = useMemo(() => {
    const start = (clampedPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, clampedPage]);

  // Keep URL in sync so pagination is shareable/bookmarkable.
  useEffect(() => {
    if (clampedPage === pageFromUrl) return;
    const next = new URLSearchParams(searchParams);
    next.set('page', String(clampedPage));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPage]);

  // If filters change, reset to page 1.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrand, searchQuery]);

  const visiblePages = useMemo(() => {
    // Show a compact range like: 1 … 4 5 6 … 20
    const pages = new Set([1, totalPages]);
    for (let p = clampedPage - 2; p <= clampedPage + 2; p += 1) {
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const p = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && p - prev > 1) out.push('…');
      out.push(p);
    }
    return out;
  }, [clampedPage, totalPages]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAddedItem(product);
  };

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAddedItem(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  return (
    <div className="shop-page">

      {/* HERO */}
      <div className="shop-hero">
        <div className="container">
          <h1>Shop All Products</h1>
          <p>Browse our complete range of remotes and accessories</p>

          <div className="hero-badges">
            <span>✓ Quality Tested</span>
            <span>🚚 Fast Shipping</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="shop-content">
        <div className="container shop-grid">

          {/* FILTERS */}
          <aside className="filters">
            <h3>Filters</h3>

            <label>Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Products</option>
              <option value="garage">Garage & Gate</option>
              <option value="car">Automotive</option>
              <option value="home">For The Home</option>
              <option value="locksmith">Locksmithing</option>
            </select>

            <label>Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              {brands.map(brand => (
                <option key={brand} value={brand}>
                  {brand === 'all' ? 'All Brands' : brand}
                </option>
              ))}
            </select>

            <button
              className="clear-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedBrand('all');
              }}
            >
              Clear Filters
            </button>
          </aside>

          {/* PRODUCTS */}
          <main>
            <p className="product-count">
              Showing {filteredProducts.length === 0 ? 0 : ((clampedPage - 1) * PAGE_SIZE + 1)}
              {' '}
              –
              {' '}
              {Math.min(clampedPage * PAGE_SIZE, filteredProducts.length)}
              {' '}
              of {filteredProducts.length} products
            </p>

            {filteredProducts.length === 0 ? (
              <div className="no-products">No products found.</div>
            ) : (
              <>
                <div className="products-grid">
                  {pageProducts.map(product => (
                  <Link
                    to={`/product/${product.id}`}
                    key={product.id}
                    className="product-card"
                  >
                    <div className="image-box">
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={(e) =>
                          (e.target.src = 'https://via.placeholder.com/300')
                        }
                      />
                    </div>

                    <div className="card-body">
                      <p className="brand">{product.brand}</p>
                      <h3>{product.name}</h3>

                      <div className="price-row">
                        <span className="price">
                          AU${product.price.toFixed(2)}
                        </span>
                        <span
                          className={`stock ${product.inStock ? 'in' : 'out'}`}
                        >
                          {product.inStock ? 'In Stock' : 'Out'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="add-to-cart"
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={!product.inStock}
                      >
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </Link>
                ))}
                </div>

                {totalPages > 1 && (
                  <div className="pager" aria-label="Pagination">
                    <button
                      type="button"
                      className="pager-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={clampedPage <= 1}
                    >
                      Prev
                    </button>

                    <div className="pager-pages">
                      {visiblePages.map((p, idx) => (
                        p === '…' ? (
                          <span key={`dots-${idx}`} className="pager-dots">…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            className={`pager-page ${p === clampedPage ? 'active' : ''}`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        )
                      ))}
                    </div>

                    <button
                      type="button"
                      className="pager-btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={clampedPage >= totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

        </div>
      </div>
      {isModalOpen && (
        <div className="cart-modal-backdrop" onClick={() => setAddedItem(null)}>
          <div
            className="cart-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Added to cart"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cart-modal-close"
              onClick={() => setAddedItem(null)}
              aria-label="Close"
            >
              x
            </button>
            <div className="cart-modal-body">
              <img
                src={addedItem?.image}
                alt={addedItem?.name || 'Product'}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300?text=Remote';
                }}
              />
              <div className="cart-modal-info">
                <p className="cart-modal-brand">{addedItem?.brand || 'Remote Pro'}</p>
                <h3>{addedItem?.name}</h3>
                {addedItem?.description && (
                  <p className="cart-modal-description">{addedItem.description}</p>
                )}
                <div className="cart-modal-meta">
                  <div>
                    <span>Category</span>
                    <strong>{addedItem?.category === 'car' ? 'Car Remote' : 'Garage Remote'}</strong>
                  </div>
                  <div>
                    <span>Condition</span>
                    <strong>{addedItem?.condition || 'Brand New'}</strong>
                  </div>
                </div>
                <div className="cart-modal-pricing">
                  <div>
                    <span>Price</span>
                    <strong>AU${addedItem?.price?.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Quantity</span>
                    <strong>1</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>AU${addedItem?.price?.toFixed(2)}</strong>
                  </div>
                </div>
                <div className="cart-modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setAddedItem(null)}
                  >
                    Continue Shopping
                  </button>
                  <Link to="/cart" className="btn btn-primary">
                    View Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
