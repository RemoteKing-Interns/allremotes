"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Key, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel, getPasswordRequirements } from "../../../lib/password-policy";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<{ strength: string; score: number } | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const passwordRequirements = getPasswordRequirements();

  // Validate token on load
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const validation = validatePassword(value);
      setPasswordStrength({
        strength: validation.strength,
        score: validation.score,
      });
      setPasswordErrors(validation.errors);
    } else {
      setPasswordStrength(null);
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError("Password does not meet security requirements");
      setPasswordErrors(passwordValidation.errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(result.error || "Failed to reset password");
        if (result.passwordErrors) {
          setPasswordErrors(result.passwordErrors);
        }
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
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              {success ? (
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              ) : error && !token ? (
                <XCircle className="h-8 w-8 text-rose-500" />
              ) : (
                <Key className="h-8 w-8 text-emerald-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {success ? "Password Reset!" : "Reset Password"}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {success
                ? "Your password has been reset successfully."
                : "Enter your new password below."}
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">
                <p>You can now log in with your new password.</p>
                <p className="mt-1">Redirecting to login...</p>
              </div>
              <Link
                href="/login"
                className="block w-full rounded-xl bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-700"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {/* New Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-neutral-800"
                >
                  New Password
                  <button
                    type="button"
                    onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
                    className="ml-2 text-xs text-emerald-600 hover:underline"
                  >
                    {showPasswordRequirements ? "Hide requirements" : "Show requirements"}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    placeholder="Create a strong password"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 pr-10 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength */}
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${passwordStrength.score}%`,
                            backgroundColor: getPasswordStrengthColor(passwordStrength.strength),
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: getPasswordStrengthColor(passwordStrength.strength) }}>
                        {getPasswordStrengthLabel(passwordStrength.strength)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                {showPasswordRequirements && (
                  <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs font-semibold text-neutral-700 mb-1">Password must have:</p>
                    <ul className="space-y-1">
                      {passwordRequirements.map((req, idx) => (
                        <li key={idx} className="text-xs text-neutral-600">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Password Errors */}
                {passwordErrors.length > 0 && (
                  <div className="mt-2 p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="text-xs font-semibold text-rose-700 mb-1">Issues:</p>
                    <ul className="space-y-1">
                      {passwordErrors.map((err, idx) => (
                        <li key={idx} className="text-xs text-rose-600">• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-neutral-800"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 pr-10 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              <p className="text-center text-xs text-neutral-500">
                Remember your password?{" "}
                <Link href="/login" className="text-emerald-600 hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
