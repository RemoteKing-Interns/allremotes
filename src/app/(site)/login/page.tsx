"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui/button";

const Login = ({ googleEnabled }: { googleEnabled: boolean }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAppleLogin] = useState(true);
  const { login, loginWithOAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const clientId = process.env.NEXT_PUBLIC_APPLE_SERVICE_ID;
      if ((window as any).AppleID && clientId) {
        try {
          (window as any).AppleID.auth.init({
            clientId,
            scope: "name email",
            redirectURI: window.location.origin,
            usePopup: true,
          });
        } catch (appleError) {
          console.error("Failed to initialize Apple Sign In:", appleError);
        }
      } else {
        console.warn(
          "Apple Sign In not configured - missing NEXT_PUBLIC_APPLE_SERVICE_ID",
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = login(email, password);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Failed to login");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setError("");
    setLoading(true);

    try {
      if (!credentialResponse?.credential) {
        throw new Error("Missing Google credential");
      }

      const decoded: any = jwtDecode(credentialResponse.credential);
      const googleUser = {
        id: decoded.sub,
        name: decoded.name || "Google User",
        email: decoded.email || "",
        provider: "google",
        picture: decoded.picture || null,
      };

      const result = await loginWithOAuth("google", googleUser);

      if (result.success) {
        router.push("/");
      } else {
        setError("Failed to login with Google");
      }
    } catch (err: any) {
      setError(`Failed to login with Google: ${err?.message || "Unknown error"}`);
    }

    setLoading(false);
  };

  const handleAppleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      if (typeof window === "undefined" || !(window as any).AppleID) {
        setError("Apple Sign In is not available. Please refresh the page.");
        setLoading(false);
        return;
      }

      const data = await (window as any).AppleID.auth.signIn();
      const response = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: data.authorization.code,
          user: data.user,
        }),
      });

      const appleResult = await response.json();

      if (!appleResult.success) {
        setError("Failed to verify Apple Sign In");
        setLoading(false);
        return;
      }

      const result = await loginWithOAuth("apple", {
        id: appleResult.user.id,
        name: appleResult.user.name,
        email: appleResult.user.email,
        provider: "apple",
        picture: null,
      });

      if (result.success) {
        router.push("/");
      } else {
        setError("Failed to login with Apple");
      }
    } catch (err) {
      console.error("Apple login error:", err);
      setError("Failed to login with Apple");
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-container-wide px-container py-10 sm:py-14">
      <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
        <motion.div
          className="rounded-2xl border border-neutral-200 bg-neutral-50/90 p-6 shadow-panel backdrop-blur md:p-8"
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
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-accent/50"
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
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-accent/50"
              />
            </div>

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="relative mt-2 flex items-center py-2">
              <div className="flex-grow border-t border-neutral-200" />
              <span className="shrink-0 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Or continue with
              </span>
              <div className="flex-grow border-t border-neutral-200" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-h-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
                {googleEnabled ? (
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => setError("Google login failed")}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                  />
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-neutral-400"
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      className="h-5 w-5 opacity-50"
                      alt="Google"
                    />
                    Google unavailable
                  </button>
                )}
              </div>

              {showAppleLogin && (
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701z" />
                  </svg>
                  Sign in with Apple
                </button>
              )}
            </div>
          </form>

          <p className="mt-6 text-sm text-neutral-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-accent-dark hover:text-accent">
              Register here
            </Link>
          </p>
        </motion.div>

        <motion.aside
          className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(251,248,245,0.85))] p-6 shadow-panel backdrop-blur md:p-8 lg:self-start"
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

const LoginWithProvider = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("Google Client ID not found in environment variables");
    return <Login googleEnabled={false} />;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Login googleEnabled />
    </GoogleOAuthProvider>
  );
};

export default LoginWithProvider;
