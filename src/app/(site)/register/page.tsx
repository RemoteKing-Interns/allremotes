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
    <div className="mx-auto w-full max-w-container-wide px-container py-10 sm:py-14">
      <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
        <motion.div
          className="rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-panel backdrop-blur md:p-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Link href="/" className="inline-flex items-center" aria-label="ALLREMOTES home">
            <img src="/images/mainlogo.png" alt="ALLREMOTES" className="h-10 w-auto" />
          </Link>

          <div className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-dark">
              New Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Register
            </h1>
            <p className="mt-3 max-w-prose text-sm leading-6 text-neutral-600">
              Create your account to save orders, checkout faster, and manage remote purchases with less friction.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm font-semibold text-primary-dark">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-semibold text-neutral-800">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-semibold text-neutral-800">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-semibold text-neutral-800">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a password (min. 6 characters)"
                minLength={6}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-neutral-800">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                minLength={6}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
              />
            </div>

            <Button type="submit" size="lg" width="full" disabled={loading} className="mt-2">
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-neutral-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent-dark hover:text-accent">
              Login here
            </Link>
          </p>
        </motion.div>

        <motion.aside
          className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(251,248,245,0.85))] p-6 shadow-panel backdrop-blur md:p-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
            Designed for repeat buyers
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Set up once, then manage purchases, addresses, and future orders from one clean account area.
          </h2>

          <div className="mt-6 grid gap-4">
            {[
              {
                title: "Save account details",
                desc: "Keep your customer information ready for faster future checkouts.",
              },
              {
                title: "Track remote purchases",
                desc: "Review what you bought and quickly reorder the models you need again.",
              },
              {
                title: "Support with context",
                desc: "Reach support with your account history already connected to your orders.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xs"
              >
                <strong className="block text-sm font-semibold text-neutral-900">
                  {item.title}
                </strong>
                <span className="mt-1 block text-sm leading-6 text-neutral-600">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default Register;
