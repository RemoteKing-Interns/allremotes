import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>ALLREMOTES</h3>
            <p>Quality is Guaranteed</p>
            <p className="footer-tagline">Your trusted source for car and garage remotes</p>
          </div>
          <div className="footer-section">
            <h4>Categories</h4>
            <Link to="/garage-gate">Garage & Gate</Link>
            <Link to="/automotive">Automotive</Link>
            <Link to="/for-the-home">For The Home</Link>
            <Link to="/locksmithing">Locksmithing</Link>
            <Link to="/shop-by-brand">Shop By Brand</Link>
          </div>
          <div className="footer-section">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/cart">Shopping Cart</Link>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <Link to="/support">Support Center</Link>
            <Link to="/contact">Contact Us</Link>
            <p>Email: support@allremotes.com</p>
            <p>Phone: 1-800-REMOTES</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 ALLREMOTES. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
