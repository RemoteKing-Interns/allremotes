"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui/button";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = login(email, password);
    
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || 'Failed to login');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-shell">
          <motion.div
            className="auth-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Link href="/" className="auth-logo-link" aria-label="ALLREMOTES home">
              <img src="/images/mainlogo.png" alt="ALLREMOTES" className="auth-logo" />
            </Link>
            <p className="auth-kicker">Customer Access</p>
            <h1>Login</h1>
            <p className="auth-subtitle">Sign in to manage orders, saved details, and faster checkout.</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                width="full"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <p className="auth-footer">
              Don't have an account? <Link href="/register">Register here</Link>
            </p>
          </motion.div>

          <motion.aside
            className="auth-aside"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
          >
            <p className="auth-side-kicker">Business-grade convenience</p>
            <h2>Everything you need to reorder, track shipments, and keep the right remotes moving.</h2>
            <div className="auth-benefits">
              <div className="auth-benefit">
                <strong>Order visibility</strong>
                <span>Review past purchases and current order status in one place.</span>
              </div>
              <div className="auth-benefit">
                <strong>Faster checkout</strong>
                <span>Use your saved addresses and payment preferences on repeat purchases.</span>
              </div>
              <div className="auth-benefit">
                <strong>Support ready</strong>
                <span>Access account tools and support details without hunting through the site.</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default Login;
