"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { isAppleDevice } from "../../../utils/deviceDetection";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAppleLogin, setShowAppleLogin] = useState(false);
  const { register, loginWithOAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setShowAppleLogin(isAppleDevice());
  }, []);

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

  const handleGoogleRegister = async (credentialResponse) => {
    setError('');
    setLoading(true);
    
    try {
      // Decode the JWT token from Google
      const decoded: any = jwtDecode(credentialResponse.credential);
      
      const googleUser = {
        id: decoded.sub,
        name: decoded.name || 'Google User',
        email: decoded.email || '',
        provider: 'google',
        picture: decoded.picture || null
      };
      
      const result = loginWithOAuth('google', googleUser);
      
      if (result.success) {
        router.push("/");
      } else {
        setError('Failed to register with Google');
      }
    } catch (err) {
      setError('Failed to register with Google: ' + err.message);
    }
    
    setLoading(false);
  };

  const handleAppleRegister = async () => {
    setError('');
    setLoading(true);
    
    try {
      // In production, this would use Apple Sign In SDK
      const mockAppleUser = {
        id: 'apple_' + Date.now(),
        name: 'Apple User',
        email: 'user@icloud.com',
        provider: 'apple',
        picture: null
      };
      
      const result = loginWithOAuth('apple', mockAppleUser);
      
      if (result.success) {
        router.push("/");
      } else {
        setError('Failed to register with Apple');
      }
    } catch (err) {
      setError('Failed to register with Apple');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <h1>Register</h1>
          <p className="auth-subtitle">Create a new account to start shopping.</p>
          
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
            
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          
          <div className="oauth-divider">
            <span>or continue with</span>
          </div>
          
          <div className="oauth-buttons">
            <div className="google-oauth-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleRegister}
                onError={() => setError('Google registration failed')}
                useOneTap={false}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="100%"
              />
            </div>
            
            {showAppleLogin && (
              <button
                type="button"
                className="btn-oauth btn-apple"
                onClick={handleAppleRegister}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.94 13.52c-.26.59-.39.86-.73 1.38-.48.74-1.16 1.66-2 1.67-.75.01-1.01-.49-1.87-.48-.86 0-1.14.49-1.86.49-.83.01-1.46-.85-1.94-1.59-1.35-2.07-1.49-4.49-.66-5.78.59-.92 1.52-1.46 2.39-1.46.89 0 1.45.49 2.18.49.71 0 1.14-.49 2.16-.49.77 0 1.58.42 2.16 1.14-1.9 1.04-1.59 3.75.17 4.63zm-2.95-8.8c.39-.5.68-1.19.59-1.9-.64.03-1.39.44-1.83.97-.39.47-.73 1.18-.64 1.87.72.05 1.45-.38 1.88-.94z"/>
                </svg>
                Continue with Apple
              </button>
            )}
          </div>
          
          <p className="auth-footer">
            Already have an account? <Link href="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const RegisterWithProvider = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    console.error('Google Client ID not found in environment variables');
    return <Register />;
  }
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Register />
    </GoogleOAuthProvider>
  );
};

export default RegisterWithProvider;
