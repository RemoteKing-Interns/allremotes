"use client";

import React, { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { getSettings } = useStore();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <>{children}</>;

  const settings = getSettings();
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;

  if (settings?.maintenanceMode && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
        {/* Logo */}
        <img
          src="/images/mainlogo.webp"
          alt="AllRemotes"
          className="mb-0 h-48 w-auto object-contain"
        />

        {/* Animation */}
        <div style={{ marginTop: "-5rem" }}>
        <DotLottieReact
          src="https://lottie.host/b033c18b-7bc1-4f29-93c3-590f18ff79bd/PAT4xpXxcz.lottie"
          loop
          autoplay
          style={{ width: 420, height: 420 }}
        />
        </div>

        {/* Headline */}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span style={{ color: "#1A7A6E" }}>Something</span>{" "}
          <span style={{ color: "#C0392B" }}>Amazing</span>{" "}
          <span className="text-neutral-900">is Coming.</span>
        </h1>

        {/* Tagline */}
        <p className="mt-4 max-w-sm text-base font-medium text-neutral-500">
          We're upgrading AllRemotes to deliver a faster, smarter experience — so you can find the right remote, faster than ever.
        </p>

        {/* Divider pill */}
        <div className="mt-6 flex items-center gap-2">
          <span className="h-1 w-8 rounded-full" style={{ backgroundColor: "#C0392B" }} />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Back Shortly</span>
          <span className="h-1 w-8 rounded-full" style={{ backgroundColor: "#1A7A6E" }} />
        </div>

        {/* eBay CTA */}
        <p className="mt-6 text-sm text-neutral-500">
          In the meantime, you can still shop our full range on
        </p>
        <a
          href="https://ebay.us/m/9cZpZy"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#C0392B" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Shop on eBay
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
