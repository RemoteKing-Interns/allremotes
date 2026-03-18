"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui/button";

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = register(name, email, password);
    
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || 'Failed to register');
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
            <p className="auth-kicker">New Account</p>
            <h1>Register</h1>
            <p className="auth-subtitle">Create your account to save orders, checkout faster, and manage remote purchases with less friction.</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>

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
                  placeholder="Create a password (min. 6 characters)"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                width="full"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Register'}
              </Button>
            </form>

            <p className="auth-footer">
              Already have an account? <Link href="/login">Login here</Link>
            </p>
          </motion.div>

          <motion.aside
            className="auth-aside"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
          >
            <p className="auth-side-kicker">Designed for repeat buyers</p>
            <h2>Set up once, then manage purchases, addresses, and future orders from one clean account area.</h2>
            <div className="auth-benefits">
              <div className="auth-benefit">
                <strong>Save account details</strong>
                <span>Keep your customer information ready for faster future checkouts.</span>
              </div>
              <div className="auth-benefit">
                <strong>Track remote purchases</strong>
                <span>Review what you bought and quickly reorder the models you need again.</span>
              </div>
              <div className="auth-benefit">
                <strong>Support with context</strong>
                <span>Reach support with your account history already connected to your orders.</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default Register;
