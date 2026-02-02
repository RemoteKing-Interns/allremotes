import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChevronDown, Phone, Shield, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Top Red Bar - Desktop Only */}
      <div className="hidden lg:block bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2.5 text-xs">
            <div className="flex items-center space-x-6">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span className="font-medium">1300 REMOTE</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>12 MONTH WARRANTY</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>FREE SHIPPING</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="hover:text-red-100 transition-colors">My Account</Link>
                  {user.role === 'admin' && <Link to="/admin" className="hover:text-red-100 transition-colors">Admin</Link>}
                  <button onClick={logout} className="hover:text-red-100 transition-colors">Logout</button>
                </>
              ) : (
                <Link to="/login" className="hover:text-red-100 transition-colors font-medium">Login / Register</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation - White background */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Row: Logo and Cart */}
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
              <span className="text-2xl font-black">
                <span className="text-gray-800">ALL</span><span className="text-red-600">REMOTES</span>
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 hover:bg-red-50 rounded-full transition-colors">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {getCartCount()}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="lg:hidden p-2 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
              </button>
            </div>
          </div>

          {/* Desktop Navigation Links - Light red/white theme */}
          <div className="hidden lg:block bg-red-50 -mx-4 px-4 border-t border-red-100">
            <div className="flex items-center justify-center space-x-1 py-3">
              <Link to="/" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white rounded transition-colors">Home</Link>
              <Link to="/shop?category=garage-remotes" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white rounded transition-colors">Garage Remotes</Link>
              <Link to="/shop?category=car-remotes" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white rounded transition-colors">Car Remotes</Link>
              <Link to="/shop?category=car-keys" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white rounded transition-colors">Car Keys</Link>
              <Link to="/shop?category=machinery" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white rounded transition-colors">Machinery</Link>
              <Link to="/shop?category=accessories" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white rounded transition-colors">Accessories</Link>
              <Link to="/shop?category=tools" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white rounded transition-colors">Tools</Link>
              <Link to="/shop" className="px-5 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded transition-colors">All Products</Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Home</Link>
              <Link to="/shop?category=garage-remotes" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Garage Remotes</Link>
              <Link to="/shop?category=car-remotes" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Car Remotes</Link>
              <Link to="/shop?category=car-keys" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Car Keys</Link>
              <Link to="/shop?category=machinery" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Machinery</Link>
              <Link to="/shop?category=accessories" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Accessories</Link>
              <Link to="/shop?category=tools" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Tools</Link>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-bold text-red-600 bg-red-50 rounded-lg transition-colors">All Products</Link>
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">My Dashboard</Link>
                    {user.role === 'admin' && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Admin Panel</Link>}
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left py-3 px-3 font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">Logout</button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 font-medium bg-red-600 text-white text-center rounded-lg hover:bg-red-700 transition-colors">Login / Register</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
