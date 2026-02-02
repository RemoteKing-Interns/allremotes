import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { products, getProductsByCategory } from '../data/products';
import ProductCard from '../components/ProductCard';
import './ProductList.css';

const ProductList = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const filteredProducts = useMemo(() => {
    let result = getProductsByCategory(category || 'all');
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      });
    }
    
    return result;
  }, [category, searchQuery]);

  const categoryName = category === 'car' ? 'Car Remotes' : 
                      category === 'garage' ? 'Garage Remotes' : 
                      'All Remotes';
  
  const displayTitle = searchQuery ? `Search Results for "${searchQuery}"` : categoryName;

  return (
    <div className="product-list-page">
      <div className="container">
        <div className="page-header">
          <h1>{displayTitle}</h1>
          <p>
            {searchQuery 
              ? `Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
              : `Browse our selection of ${categoryName.toLowerCase()}`
            }
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>
              {searchQuery 
                ? `No products found for "${searchQuery}". Try a different search term.`
                : 'No products found in this category.'
              }
            </p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
