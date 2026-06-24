"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Eye, EyeOff, ShieldCheck, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

type Step = "loading" | "invalid" | "setup" | "2fa" | "done";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [step, setStep] = useState<Step>("loading");
  const [invite, setInvite] = useState<{ email: string; name: string; permissions: string[] } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Password setup
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 2FA setup
  const [totpSecret, setTotpSecret] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [skip2fa, setSkip2fa] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setStep("invalid");
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/admin/invite?token=${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid invite link");
        setStep("invalid");
        return;
      }
      setInvite(data);
      setStep("setup");
    } catch {
      setError("Failed to validate invite");
      setStep("invalid");
    }
  };

  const generate2FA = async () => {
    if (!invite) return;
    const res = await fetch(`/api/admin/2fa?email=${encodeURIComponent(invite.email)}`);
    const data = await res.json();
    setTotpSecret(data.secret);
    setTotpUri(data.uri);
    const qr = await QRCode.toDataURL(data.uri);
    setQrDataUrl(qr);
    setStep("2fa");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (skip2fa) {
      await submitAccount(null, null);
    } else {
      await generate2FA();
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (totpCode.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app");
      return;
    }
    await submitAccount(totpSecret, totpCode);
  };

  const submitAccount = async (secret: string | null, code: string | null) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          totpSecret: secret,
          totpCode: code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set up account");
        return;
      }
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-6 text-center">
          <div className="text-white font-bold text-2xl tracking-tight">All Remotes</div>
          <div className="text-emerald-100 text-sm mt-1">Admin Panel Setup</div>
        </div>

        <div className="px-8 py-6">
          {/* Loading */}
          {step === "loading" && (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-3" />
              <p className="text-neutral-500">Validating your invite...</p>
            </div>
          )}

          {/* Invalid */}
          {step === "invalid" && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Invite Invalid</h2>
              <p className="text-neutral-500">{error || "This invite link is invalid or has expired."}</p>
            </div>
          )}

          {/* Password Setup */}
          {step === "setup" && invite && (
            <>
              <h2 className="text-xl font-semibold text-neutral-900 mb-1">Set Up Your Account</h2>
              <p className="text-sm text-neutral-500 mb-6">
                Welcome, <strong>{invite.name}</strong>! Create your admin password to get started.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={invite.email}
                    disabled
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skip2fa}
                      onChange={(e) => setSkip2fa(e.target.checked)}
                      className="mt-0.5 rounded border-neutral-300 text-emerald-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-neutral-700">Skip 2FA setup for now</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Not recommended. You can enable 2FA later from your profile settings.
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {skip2fa ? "Create Account" : "Continue to 2FA Setup"}
                </button>
              </form>
            </>
          )}

          {/* 2FA Setup */}
          {step === "2fa" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-semibold text-neutral-900">Set Up Two-Factor Auth</h2>
              </div>
              <p className="text-sm text-neutral-500 mb-6">
                Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.) then enter the 6-digit code to confirm.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* QR Code */}
              {qrDataUrl && (
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white border-2 border-neutral-200 rounded-xl inline-block">
                    <img src={qrDataUrl} alt="2FA QR Code" className="w-44 h-44" />
                  </div>
                </div>
              )}

              {/* Manual secret */}
              <div className="mb-4">
                <div className="text-xs text-neutral-500 mb-1">Or enter this key manually:</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-xs font-mono break-all">
                    {totpSecret}
                  </code>
                  <button onClick={copySecret} className="p-2 text-neutral-500 hover:text-neutral-700">
                    {secretCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <form onSubmit={handle2faSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Enter 6-digit code from your app
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-xl tracking-widest font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || totpCode.length !== 6}
                  className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Verify &amp; Complete Setup
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("setup"); setError(""); }}
                  className="w-full text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Back
                </button>
              </form>
            </>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="text-center py-8">
              <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Account Ready!</h2>
              <p className="text-neutral-500 mb-6">
                Your admin account has been set up successfully. You can now sign in.
              </p>
              <button
                onClick={() => router.push("/admin")}
                className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
              >
                Go to Admin Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
