"use client";

import { useEffect, useState } from "react";

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  duration: string;
  enabled: boolean;
}

interface ShippingSettings {
  options: ShippingOption[];
}

const defaultOptions: ShippingOption[] = [
  { id: "free", name: "Free Untracked Shipping", price: 0, duration: "2-10 business days", enabled: true },
  { id: "tracked", name: "Tracked Shipping", price: 12, duration: "2-6 business days", enabled: true },
  { id: "express", name: "Express Shipping", price: 18, duration: "1-3 business days", enabled: true },
];

export default function AdminShippingPage() {
  const [shipping, setShipping] = useState<ShippingSettings>({ options: defaultOptions });
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch("/api/content/shipping", { cache: "no-store" });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || "Failed to load shipping settings");
        if (!cancelled) {
          const opts = data?.data?.options || defaultOptions;
          // Ensure all options exist with defaults
          const merged = defaultOptions.map(def => {
            const found = opts.find((o: ShippingOption) => o?.id === def.id);
            return found ? { ...def, ...found, price: Number(found.price ?? def.price) } : def;
          });
          setShipping({ options: merged });
        }
      } catch {
        if (!cancelled) setShipping({ options: defaultOptions });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const saveShipping = async () => {
    setSaveSuccess("");
    setSaveError("");
    try {
      const resp = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "shipping", data: shipping }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to save shipping settings");
      setSaveSuccess("Shipping settings saved successfully!");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save shipping settings");
    }
  };

  const updateOption = (id: string, field: keyof ShippingOption, value: any) => {
    setShipping(prev => ({
      options: prev.options.map(opt =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Shipping Settings</h1>
            <p className="mt-1 text-sm text-neutral-500">Manage fixed shipping rates for checkout.</p>
          </div>
          <button
            onClick={saveShipping}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Settings
          </button>
        </div>

        {saveSuccess && (
          <div className="mb-8 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {saveSuccess}
          </div>
        )}
        {saveError && (
          <div className="mb-8 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            {saveError}
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-neutral-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Fixed Shipping Rates</h3>
              <p className="text-xs text-neutral-500">Configure flat-rate shipping options. These prices are fixed and do not vary by address.</p>
            </div>
          </div>

          <div className="space-y-6">
            {shipping.options.map((option) => (
              <div key={option.id} className="rounded-lg border border-neutral-200 p-4 bg-neutral-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">{option.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600">{option.id}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={option.enabled}
                      onChange={(e) => updateOption(option.id, "enabled", e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-600">Enabled</span>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => updateOption(option.id, "name", e.target.value)}
                      className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Price (AUD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={option.price}
                        onChange={(e) => updateOption(option.id, "price", Number(e.target.value))}
                        className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-7 pr-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Delivery Time</label>
                    <input
                      type="text"
                      value={option.duration}
                      onChange={(e) => updateOption(option.id, "duration", e.target.value)}
                      className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g., 2-6 business days"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <div className="flex items-start gap-3 text-sm text-neutral-500">
              <svg className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                <span className="font-medium text-neutral-700">Note:</span> These are fixed rates that will be shown to all customers during checkout. 
                They do not depend on the delivery address. 
                To disable a shipping option, uncheck the "Enabled" checkbox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
