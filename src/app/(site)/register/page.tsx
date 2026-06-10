"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui/button";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel, getPasswordRequirements } from "../../../lib/password-policy";

// Remove border and hover effects from Google Sign-In button
const googleButtonStyles = `
  .nsm7Bb-HzV7m-LgbsSe-MJoBVe,
  .nsm7Bb-HzV7m-LgbsSe {
    border: none !important;
    box-shadow: none !important;
    background-image: none !important;
    transition: none !important;
  }
  .nsm7Bb-HzV7m-LgbsSe {
    background-color: transparent !important;
  }
  .nsm7Bb-HzV7m-LgbsSe:hover,
  .nsm7Bb-HzV7m-LgbsSe-MJoBVe:hover {
    background-color: transparent !important;
    box-shadow: none !important;
  }
`;

const Register = ({ googleEnabled }: { googleEnabled: boolean }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<{ strength: string; score: number } | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAppleLogin] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  // Email availability check states
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [isOAuthAccount, setIsOAuthAccount] = useState(false);
  const { register, loginWithOAuth } = useAuth();
  const router = useRouter();
  const passwordRequirements = getPasswordRequirements();

  // Check email availability
  const checkEmailAvailability = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes("@")) {
      setEmailStatus("idle");
      setEmailMessage("");
      setEmailExists(false);
      return;
    }

    setEmailStatus("checking");
    setEmailMessage("Checking availability...");

    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(emailToCheck)}`);
      const result = await response.json();

      if (result.success) {
        if (result.available) {
          setEmailStatus("available");
          setEmailMessage("Email is available");
          setEmailExists(false);
          setIsOAuthAccount(false);
        } else {
          setEmailStatus("taken");
          setEmailMessage(result.message);
          setEmailExists(true);
          setIsOAuthAccount(result.isOAuth);
        }
      } else {
        setEmailStatus("idle");
        setEmailMessage("");
      }
    } catch (err) {
      console.error("Error checking email:", err);
      setEmailStatus("idle");
      setEmailMessage("");
    }
  };

  // Debounced email check
  const emailTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailStatus("idle");
    setEmailMessage("");
    setEmailExists(false);

    // Clear previous timeout
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }

    // Check after user stops typing for 500ms
    if (value.includes("@")) {
      emailTimeoutRef.current = setTimeout(() => {
        checkEmailAvailability(value);
      }, 500);
    }
  };

  // Check email when user leaves email field or focuses on password
  const handleEmailBlur = () => {
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }
    checkEmailAvailability(email);
  };

  const handlePasswordFocus = () => {
    // Check email availability when user starts entering password
    if (emailStatus === "idle" && email.includes("@")) {
      checkEmailAvailability(email);
    }
  };

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

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check if email already exists
    if (emailExists) {
      setError(emailMessage || "This email is already registered");
      return;
    }

    // Client-side password validation
    const passwordValidation = validatePassword(password, name, email);
    if (!passwordValidation.valid) {
      setError("Password does not meet security requirements");
      setPasswordErrors(passwordValidation.errors);
      return;
    }

    setLoading(true);

    try {
      const result = await register(name, email, password);

      if (result.success) {
        // Check if email verification is required
        if (result.verificationRequired) {
          setRegistrationSuccess(true);
          setRegisteredEmail(email);
        } else {
          router.push("/");
        }
      } else {
        setError(result.error || "Failed to register");
        if (result.passwordErrors) {
          setPasswordErrors(result.passwordErrors);
        }
      }
    } catch (err: any) {
      if (err?.passwordErrors) {
        setError("Password does not meet security requirements");
        setPasswordErrors(err.passwordErrors);
      } else {
        setError("An error occurred during registration");
      }
    }

    setLoading(false);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const validation = validatePassword(value, name, email);
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

  const handleGoogleRegister = async (credentialResponse: any) => {
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
        setError("Failed to register with Google");
      }
    } catch (err: any) {
      setError(
        `Failed to register with Google: ${err?.message || "Unknown error"}`,
      );
    }

    setLoading(false);
  };

  const handleAppleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      if (typeof window === "undefined" || !(window as any).AppleID) {
        setError("Apple Sign In is not available");
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
        setError("Failed to register with Apple");
      }
    } catch (err) {
      console.error("Apple registration error:", err);
      setError("Failed to register with Apple");
    }

    setLoading(false);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: googleButtonStyles }} />
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

          {/* Success State - Email Verification Sent */}
          {registrationSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-emerald-800">Registration Successful!</h3>
              <p className="mb-4 text-sm text-emerald-700">
                We&apos;ve sent a verification email to <strong>{registeredEmail}</strong>.
                Please check your inbox and click the verification link to complete your registration.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Go to Login
                </Link>
                <p className="text-xs text-emerald-600">
                  Didn&apos;t receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setRegistrationSuccess(false)}
                    className="underline hover:no-underline"
                  >
                    try again
                  </button>
                </p>
              </div>
            </motion.div>
          ) : (
            <>
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
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-accent/50"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-semibold text-neutral-800">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                  placeholder="Enter your email"
                  className={`h-12 w-full rounded-2xl border bg-white px-4 pr-10 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:outline-none ${
                    emailStatus === "taken"
                      ? "border-rose-400 focus:border-rose-500"
                      : emailStatus === "available"
                      ? "border-emerald-400 focus:border-emerald-500"
                      : "border-neutral-300 focus:border-accent/50"
                  }`}
                />
                {/* Email status indicator */}
                {emailStatus !== "idle" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailStatus === "checking" && (
                      <svg className="h-5 w-5 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {emailStatus === "available" && (
                      <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {emailStatus === "taken" && (
                      <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {/* Email status message */}
              {emailMessage && (
                <p className={`text-xs ${
                  emailStatus === "taken" 
                    ? "text-rose-600" 
                    : emailStatus === "available" 
                    ? "text-emerald-600" 
                    : "text-neutral-500"
                }`}>
                  {emailMessage}
                  {emailStatus === "taken" && !isOAuthAccount && (
                    <span> - <Link href="/login" className="underline hover:no-underline">Log in here</Link></span>
                  )}
                  {emailStatus === "taken" && isOAuthAccount && (
                    <span> - Use Google or Apple sign in above</span>
                  )}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-semibold text-neutral-800">
                Password
                <button
                  type="button"
                  onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
                  className="ml-2 text-xs text-primary hover:underline"
                >
                  {showPasswordRequirements ? 'Hide requirements' : 'Show requirements'}
                </button>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onFocus={handlePasswordFocus}
                required
                placeholder="Create a strong password"
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-accent/50"
              />
              
              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="mt-1">
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
                <div className="mt-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="text-xs font-semibold text-neutral-700 mb-2">Password must have:</p>
                  <ul className="space-y-1">
                    {passwordRequirements.map((req, idx) => (
                      <li key={idx} className="text-xs text-neutral-600 flex items-start gap-1.5">
                        <span className="text-neutral-400 mt-0.5">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Password Errors */}
              {passwordErrors.length > 0 && (
                <div className="mt-2 p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-xs font-semibold text-rose-700 mb-1">Password issues:</p>
                  <ul className="space-y-1">
                    {passwordErrors.map((err, idx) => (
                      <li key={idx} className="text-xs text-rose-600 flex items-start gap-1.5">
                        <span className="text-rose-400 mt-0.5">•</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-accent/50"
              />
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="mt-2 w-full" 
              disabled={loading || emailStatus === "taken" || emailStatus === "checking"}
            >
              {loading ? "Creating account..." : emailStatus === "taken" ? "Email already registered" : "Register"}
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
                    onSuccess={handleGoogleRegister}
                    onError={() => setError("Google registration failed")}
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
                  onClick={handleAppleRegister}
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
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent-dark hover:text-accent">
              Login here
            </Link>
          </p>
          </>
          )}
        </motion.div>

        <motion.aside
          className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(251,248,245,0.85))] p-6 shadow-panel backdrop-blur md:p-8 lg:self-start"
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
    </>
  );
};

const RegisterWithProvider = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("Google Client ID not found in environment variables");
    return <Register googleEnabled={false} />;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Register googleEnabled />
    </GoogleOAuthProvider>
  );
};

export default RegisterWithProvider;
