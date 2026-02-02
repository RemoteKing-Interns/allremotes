import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CarFinder from '@/components/CarFinder';
import { Button } from '@/components/ui/button';
import { ArrowRight, Key, Lock, Car, Wrench, Shield, Truck, Headphones } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?featured=true`);
      setFeaturedProducts(response.data.slice(0, 8));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast.error('Failed to load featured products');
    } finally {
      setLoading(false);
    }
  };

  const handleCarSearch = (searchParams) => {
    navigate(`/shop?brand=${searchParams.brand}&search=${searchParams.model || ''}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section 
        className="relative py-16 md:py-24 lg:py-32 overflow-hidden"
        data-testid="hero-section"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1761264889404-a194af20ae90)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container relative z-10 px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Australia's Leading Remote & Key Specialists
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 md:mb-8 leading-relaxed">
              Genuine replacement remotes for all car brands, garage door openers, and professional key cutting equipment. Fast shipping across Australia.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
              <Link to="/shop" data-testid="shop-now-button">
                <Button className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 h-12 px-6 md:px-8 text-sm md:text-base font-bold uppercase tracking-wide shadow-lg">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
              <a href="#categories" data-testid="browse-categories-button">
                <Button className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 h-12 px-6 md:px-8 text-sm md:text-base font-bold uppercase tracking-wide">
                  Browse Categories
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Car Finder Section */}
      <section 
        className="py-12 md:py-16 relative overflow-hidden" 
        data-testid="car-finder-section"
        style={{
          backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Decorative pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        <div className="container px-4 relative z-10">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Find Your Car Remote
            </h2>
            <p className="text-base md:text-lg text-text-secondary">
              Search by registration or select your car manually
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <CarFinder onSearch={handleCarSearch} />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-24" id="categories" data-testid="categories-section">
        <div className="container px-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Shop By Category
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Link 
              to="/shop?category=car-remotes" 
              className="group relative overflow-hidden rounded-sm border border-border bg-white hover:shadow-hover transition-all duration-300 animate-scale-in"
              style={{ animationDelay: '0.1s' }}
              data-testid="category-car-remotes"
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1745242666792-6cd30907f7ff" 
                  alt="Car Remotes"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-4 md:p-6 border-t border-border">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Car className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                  <h3 className="text-base md:text-xl font-bold leading-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>Car Remotes</h3>
                </div>
                <p className="text-xs md:text-sm text-text-secondary">All Australian car brands</p>
              </div>
            </Link>

            <Link 
              to="/shop?category=garage-remotes" 
              className="group relative overflow-hidden rounded-sm border border-border bg-white hover:shadow-hover transition-all duration-300 animate-scale-in"
              style={{ animationDelay: '0.2s' }}
              data-testid="category-garage-remotes"
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1675747158954-4a32e28812c0" 
                  alt="Garage Remotes"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-4 md:p-6 border-t border-border">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Lock className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                  <h3 className="text-base md:text-xl font-bold leading-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>Garage Remotes</h3>
                </div>
                <p className="text-xs md:text-sm text-text-secondary">All major brands</p>
              </div>
            </Link>

            <Link 
              to="/shop?category=car-keys" 
              className="group relative overflow-hidden rounded-sm border border-border bg-white hover:shadow-hover transition-all duration-300 animate-scale-in"
              style={{ animationDelay: '0.3s' }}
              data-testid="category-car-keys"
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1761264889404-a194af20ae90" 
                  alt="Car Keys"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-4 md:p-6 border-t border-border">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Key className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                  <h3 className="text-base md:text-xl font-bold leading-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>Car Keys</h3>
                </div>
                <p className="text-xs md:text-sm text-text-secondary">Replacement keys</p>
              </div>
            </Link>

            <Link 
              to="/shop?category=machinery" 
              className="group relative overflow-hidden rounded-sm border border-border bg-white hover:shadow-hover transition-all duration-300 animate-scale-in"
              style={{ animationDelay: '0.4s' }}
              data-testid="category-machinery"
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1749477417968-2bc986bc6a42" 
                  alt="Machinery"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-4 md:p-6 border-t border-border">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Wrench className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                  <h3 className="text-base md:text-xl font-bold leading-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>Machinery & Tools</h3>
                </div>
                <p className="text-xs md:text-sm text-text-secondary">Professional equipment</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-24 bg-white" data-testid="featured-products-section">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 md:mb-12 gap-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-center sm:text-left" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Featured Products
            </h2>
            <Link to="/shop" data-testid="view-all-link">
              <Button className="bg-red-600 text-white hover:bg-red-700 border-2 border-red-600 w-full sm:w-auto shadow-md">
                View All
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-background-paper border border-border rounded-sm p-4 animate-pulse">
                  <div className="aspect-square bg-border mb-4"></div>
                  <div className="h-4 bg-border mb-2"></div>
                  <div className="h-4 bg-border w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product, index) => (
                <Link 
                  key={product.id} 
                  to={`/product/${product.id}`}
                  className="group bg-white border border-border rounded-sm overflow-hidden hover:shadow-hover transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="aspect-square overflow-hidden bg-background">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 md:p-4">
                    <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">{product.brand}</p>
                    <h3 className="font-bold text-xs md:text-sm mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-primary text-lg md:text-xl font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 md:py-24 bg-[#2B2D42] text-white" data-testid="why-choose-section">
        <div className="container">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 tracking-tight px-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Why Choose All Remotes
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-4">
            <div className="text-center" data-testid="feature-genuine">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>Genuine & Quality</h3>
              <p className="text-sm md:text-base text-white/80">OEM quality remotes and keys for all major Australian vehicle brands</p>
            </div>
            
            <div className="text-center" data-testid="feature-fast">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>Free Shipping</h3>
              <p className="text-sm md:text-base text-white/80">Fast and free delivery across Australia on all orders</p>
            </div>
            
            <div className="text-center" data-testid="feature-expert">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>Expert Support</h3>
              <p className="text-sm md:text-base text-white/80">Professional advice and technical support for all products</p>
            </div>

            <div className="text-center" data-testid="feature-warranty">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
                <Key className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>12 Month Warranty</h3>
              <p className="text-sm md:text-base text-white/80">All products backed by comprehensive warranty coverage</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
