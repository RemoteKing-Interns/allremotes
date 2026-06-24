"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid reset link. Please ask an admin to send a new one.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordErrors([]);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/admin/users/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        if (data.passwordErrors) setPasswordErrors(data.passwordErrors);
        else setError(data.error || "Failed to reset password.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin"), 3000);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Password Updated</h2>
        <p className="text-neutral-500 text-sm">Redirecting you to the admin panel…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Lock className="h-5 w-5 text-emerald-700" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Set New Password</h1>
        <p className="text-sm text-neutral-500 mt-1">Choose a strong password for your admin account.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {passwordErrors.length > 0 && (
        <ul className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-1 list-disc list-inside">
          {passwordErrors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter new password"
              disabled={!token}
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Repeat new password"
              disabled={!token}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <Suspense fallback={<div className="text-center text-neutral-500 text-sm">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
