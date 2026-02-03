import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { products, getProductsByCategory } from '../data/products';
import './ProductList.css';

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('all');

  const brands = useMemo(() => {
    return ['all', ...new Set(products.map(p => p.brand))];
  }, []);

  const filteredProducts = useMemo(() => {
    let result = getProductsByCategory(selectedCategory);

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
  }, [selectedCategory, selectedBrand, searchQuery]);

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
              Showing {filteredProducts.length} products
            </p>

            {filteredProducts.length === 0 ? (
              <div className="no-products">No products found.</div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map(product => (
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
};

export default ProductList;
