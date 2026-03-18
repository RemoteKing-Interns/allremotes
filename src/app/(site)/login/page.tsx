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
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
              Customer Access
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Login
            </h1>
            <p className="mt-3 max-w-prose text-sm leading-6 text-neutral-600">
              Sign in to manage orders, saved details, and faster checkout.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm font-semibold text-primary-dark">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
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
                placeholder="Enter your password"
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
              />
            </div>

            <Button type="submit" size="lg" width="full" disabled={loading} className="mt-2">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-neutral-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-accent-dark hover:text-accent">
              Register here
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
            Business-grade convenience
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Everything you need to reorder, track shipments, and keep the right remotes moving.
          </h2>

          <div className="mt-6 grid gap-4">
            {[
              {
                title: "Order visibility",
                desc: "Review past purchases and current order status in one place.",
              },
              {
                title: "Faster checkout",
                desc: "Use your saved addresses and payment preferences on repeat purchases.",
              },
              {
                title: "Support ready",
                desc: "Access account tools and support details without hunting through the site.",
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

export default Login;
