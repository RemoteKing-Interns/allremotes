import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState('');

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'car-remotes', name: 'Car Remotes' },
    { id: 'garage-remotes', name: 'Garage Remotes' },
    { id: 'car-keys', name: 'Car Keys' },
    { id: 'lock-keys', name: 'Lock Keys' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'machinery', name: 'Machinery' },
    { id: 'tools', name: 'Tools' }
  ];

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedBrand, searchQuery]);

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API}/brands`);
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedBrand && selectedBrand !== 'all') params.brand = selectedBrand;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get(`${API}/products`, { params });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Shop Header with light red background */}
      <div 
        className="py-12 relative overflow-hidden bg-gradient-to-r from-red-600 to-red-500"
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-white" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="shop-title">
            Shop All Products
          </h1>
          <p className="text-white/90 text-lg">Browse our complete range of remotes, keys, and equipment</p>
          <div className="flex gap-2 mt-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 text-sm font-medium rounded-full">
              <span>✓</span> 119+ Products
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-sm rounded-full">
              <span>🚚</span> Free Shipping
            </span>
          </div>
        </div>
      </div>

      {/* Main content with subtle pattern background */}
      <div 
        className="py-8 relative"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23dc2626' fill-opacity='0.03'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2.5L25 18l-5 2.5z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#fafafa'
        }}
      >
        <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1" data-testid="filter-sidebar">
            <div 
              className="rounded-lg p-6 sticky top-20 shadow-lg border-l-4 border-l-red-600"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
              }}
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-red-600 rounded-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Chivo, sans-serif' }}>Filters</h2>
              </div>

              <form onSubmit={handleSearchSubmit} className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Search Products</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-50 border-gray-200 focus:border-red-500 focus:ring-red-500"
                    data-testid="search-input"
                  />
                  <Button type="submit" size="icon" className="bg-red-600 hover:bg-red-700" data-testid="search-button">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 hover:border-red-300 transition-colors" data-testid="category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id || 'all'} value={cat.id || 'all'}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Brand</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 hover:border-red-300 transition-colors" data-testid="brand-filter">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors font-semibold"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                  setSearchQuery('');
                }}
                data-testid="clear-filters-button"
              >
                Clear All Filters
              </Button>
              
              {/* Quick category links */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('car-remotes')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                  >
                    🚗 Car Remotes
                  </button>
                  <button
                    onClick={() => setSelectedCategory('garage-remotes')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                  >
                    🏠 Garage Remotes
                  </button>
                  <button
                    onClick={() => setSelectedCategory('car-keys')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                  >
                    🔑 Car Keys
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3" data-testid="products-grid">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white border border-border rounded-sm p-4 animate-pulse">
                    <div className="aspect-square bg-border mb-4"></div>
                    <div className="h-4 bg-border mb-2"></div>
                    <div className="h-4 bg-border w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16" data-testid="no-products">
                <p className="text-text-secondary text-lg">No products found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm text-text-secondary" data-testid="product-count">
                    Showing {products.length} products
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map(product => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group bg-white border border-border rounded-sm overflow-hidden hover:shadow-hover transition-all duration-300"
                      data-testid={`product-card-${product.id}`}
                    >
                      <div className="aspect-square overflow-hidden bg-background">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">{product.brand}</p>
                        <h3 className="font-bold text-sm mb-2 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-primary text-xl font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>
                            ${product.price.toFixed(2)}
                          </p>
                          {product.stock > 0 ? (
                            <span className="text-xs text-status-success font-medium">In Stock</span>
                          ) : (
                            <span className="text-xs text-status-error font-medium">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Shop;
