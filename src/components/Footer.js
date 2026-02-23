import React from 'react';
import Link from 'next/link';

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
            <Link href="/garage-gate">Garage & Gate</Link>
            <Link href="/automotive">Automotive</Link>
            <Link href="/for-the-home">For The Home</Link>
            <Link href="/locksmithing">Locksmithing</Link>
            <Link href="/shop-by-brand">Shop By Brand</Link>
          </div>
          <div className="footer-section">
            <h4>Account</h4>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
            <Link href="/cart">Shopping Cart</Link>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <Link href="/support">Support Center</Link>
            <Link href="/contact">Contact Us</Link>
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
