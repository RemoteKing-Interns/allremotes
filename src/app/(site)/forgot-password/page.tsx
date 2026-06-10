"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send reset link");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white py-20">
      <div className="mx-auto max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg"
        >
          {/* Back to Login */}
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              {success ? (
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              ) : (
                <Mail className="h-8 w-8 text-emerald-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {success ? "Check Your Email" : "Forgot Password?"}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {success
                ? "We've sent a password reset link to your email."
                : "Enter your email and we'll send you a link to reset your password."}
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">
                <p>Please check your inbox and spam folder.</p>
                <p className="mt-1">The link will expire in 1 hour.</p>
              </div>
              <Link
                href="/login"
                className="block w-full rounded-xl bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-700"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-neutral-800"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <p className="text-center text-xs text-neutral-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-emerald-600 hover:underline">
                  Register here
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
