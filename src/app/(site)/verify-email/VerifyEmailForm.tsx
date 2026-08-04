"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email for the correct link.");
      return;
    }

    // Verify the token
    const verifyToken = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (result.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          setEmail(result.email || "");
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(result.error || "Failed to verify email. The link may have expired.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while verifying your email. Please try again.");
      }
    };

    verifyToken();
  }, [token, router]);

  const handleResendEmail = async () => {
    if (!email || !email.includes("@")) {
      setMessage("Please enter your email address to resend the verification link.");
      return;
    }

    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setResendSuccess(true);
        setMessage("A new verification email has been sent. Please check your inbox.");
      } else {
        setMessage(result.error || "Failed to resend verification email.");
      }
    } catch (error) {
      setMessage("An error occurred while resending the verification email.");
    }

    setResendLoading(false);
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Email Verification</h1>
          </div>

          {/* Status Icon */}
          <div className="mb-6 flex justify-center">
            {status === "verifying" && (
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-rose-500" />
            )}
          </div>

          {/* Message */}
          <div className="mb-6 text-center">
            <p
              className={`text-lg font-medium ${
                status === "success"
                  ? "text-emerald-700"
                  : status === "error"
                  ? "text-rose-700"
                  : "text-neutral-700"
              }`}
            >
              {message}
            </p>
          </div>

          {/* Resend Email Form (shown on error) */}
          {status === "error" && !resendSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6"
            >
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Enter your email to resend verification link
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Resend"
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Success Resend Message */}
          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-700"
            >
              <CheckCircle className="mx-auto mb-2 h-5 w-5" />
              Verification email resent successfully!
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {status === "success" && (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-center font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Continue to Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/"
              className="rounded-xl border border-neutral-300 px-6 py-3 text-center font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-xs text-neutral-500">
            <p>
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <Link href="/contact" className="text-emerald-600 hover:underline">
                contact support
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
