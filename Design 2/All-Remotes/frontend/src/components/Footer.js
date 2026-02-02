import { Link } from 'react-router-dom';
import { Key } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1A1A1A] text-white py-12" data-testid="footer">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-6 w-6 text-primary" />
              <span className="text-xl font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>
                ALL<span className="text-primary">REMOTES</span>
              </span>
            </div>
            <p className="text-sm text-white/60">
              Australia's trusted source for car remotes, garage remotes, and key cutting equipment.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/shop?category=car-remotes" className="hover:text-white transition-colors">Car Remotes</Link></li>
              <li><Link to="/shop?category=garage-remotes" className="hover:text-white transition-colors">Garage Remotes</Link></li>
              <li><Link to="/shop?category=machinery" className="hover:text-white transition-colors">Machinery</Link></li>
              <li><Link to="/shop?category=tools" className="hover:text-white transition-colors">Tools</Link></li>
              <li><Link to="/shop?category=accessories" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-3">Customer Service</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Warranty Info</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-3">Contact Us</h4>
            <div className="space-y-2 text-sm text-white/60">
              <p>📧 info@allremotes.com.au</p>
              <p>📞 1300 REMOTE</p>
              <p>🕐 Mon-Fri: 9am - 5pm AEST</p>
              <p className="mt-4">
                📍 Sydney & Brisbane<br />
                Servicing all of Australia
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
            <p>&copy; 2025 All Remotes Australia. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-white transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
