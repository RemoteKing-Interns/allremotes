"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const RETURN_REASONS = [
  { value: "faulty", label: "Faulty / Defective Product" },
  { value: "stopped_working", label: "Stopped Working (No Physical Damage)" },
];

const MAX_PHOTOS = 5;

export default function GuestReturnsPage() {
  const [step, setStep] = useState<"lookup" | "form" | "success">("lookup");

  // Lookup state
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [looking, setLooking] = useState(false);
  const [order, setOrder] = useState<any>(null);

  // Form state
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    setLooking(true);
    try {
      const cleanId = orderId.trim().replace(/^#/, "");
      const cleanEmail = email.trim().toLowerCase();
      const params = new URLSearchParams({ orderId: cleanId, email: cleanEmail });
      const resp = await fetch(`/api/orders?${params}`);
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data) throw new Error("Order not found. Please check your order number and email address.");
      const orders: any[] = Array.isArray(data) ? data : data.orders || [];
      const found = orders.find(
        (o: any) =>
          String(o.id || "").toLowerCase().includes(cleanId.toLowerCase()) &&
          String(o.customer?.email || "").toLowerCase() === cleanEmail
      );
      if (!found) throw new Error("Order not found. Please check your order number and email address.");

      const status = String(found.status || "").toLowerCase();
      const allowedStatuses = ["shipped", "delivered", "customer_received"];
      if (!allowedStatuses.includes(status)) {
        throw new Error("Warranty claims can only be made for shipped or delivered orders.");
      }

      setOrder(found);
      setSelectedItems(
        (found.items || []).map((item: any, idx: number) => ({
          ...item,
          selected: true,
          returnQty: item.quantity || 1,
          idx,
        }))
      );
      setStep("form");
    } catch (err: any) {
      setLookupError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLooking(false);
    }
  };

  const toggleItem = (idx: number) => {
    setSelectedItems((prev) => prev.map((item) => item.idx === idx ? { ...item, selected: !item.selected } : item));
  };

  const updateQty = (idx: number, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => item.idx === idx ? { ...item, returnQty: Math.max(1, Math.min(qty, item.quantity || 1)) } : item)
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, MAX_PHOTOS - photos.length);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => prev.length < MAX_PHOTOS ? [...prev, ev.target?.result as string] : prev);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const itemsToReturn = selectedItems.filter((i) => i.selected);
    if (itemsToReturn.length === 0) { setFormError("Please select at least one item."); return; }
    if (!reason) { setFormError("Please select a reason."); return; }
    if (!reasonDetails.trim()) { setFormError("Please describe the issue."); return; }

    setSubmitting(true);
    try {
      const resp = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderDate: order.createdAt,
          customerEmail: email.trim().toLowerCase(),
          customerName: order?.customer?.fullName || order?.customer?.name || "",
          items: itemsToReturn.map((item: any) => ({
            productId: item.id || item.productId || "",
            productName: item.name || item.productName || "",
            quantity: item.returnQty,
            price: item.price || 0,
          })),
          reason,
          reasonDetails,
          photos,
          shippedDate: order.shippedAt || order.shippedDate,
        }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to submit claim.");
      setStep("success");
    } catch (err: any) {
      setFormError(err?.message || "Failed to submit claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg border border-neutral-200 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
          <h2 className="text-2xl font-bold text-neutral-900">Warranty Claim Submitted</h2>
          <p className="mt-3 text-sm text-neutral-600">
            We&apos;ll review your claim within <strong>1–2 business days</strong> and email you at <strong>{email}</strong> with next steps.
          </p>
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left">
            <p className="text-xs font-semibold text-amber-800 mb-2">What happens next?</p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>We review your request in 1–2 business days</li>
              <li>If approved, you ship the item back at your expense</li>
              <li>We inspect within 10–15 business days of receiving it</li>
              <li>Resolution: exchange or refund at our discretion</li>
            </ul>
          </div>
          <Link href="/" className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-100">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Warranty / Return Claim</h1>
          <p className="mt-2 text-neutral-600">
            Have an account?{" "}
            <Link href="/account?tab=orders" className="text-accent-dark hover:underline font-semibold">Sign in and use the Orders tab</Link> instead.
          </p>
        </div>

        {step === "lookup" && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900">Look Up Your Order</h2>
            <p className="mt-1 text-sm text-neutral-500">Enter the order number and email address used when ordering.</p>

            <form onSubmit={handleLookup} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Order Number *</label>
                <input
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ARSO-000042"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
                <p className="mt-1.5 text-xs text-neutral-400">Found in your order confirmation email — copy it exactly as shown</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email used when ordering"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>

              {lookupError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{lookupError}</div>
              )}

              <button
                type="submit"
                disabled={looking}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
              >
                {looking ? "Looking up…" : "Find Order"}
              </button>
            </form>

            <p className="mt-4 text-xs text-neutral-400 text-center">
              Can&apos;t find your order? Email us at{" "}
              <a href="mailto:info@allremotes.com.au" className="text-accent-dark hover:underline">info@allremotes.com.au</a>
            </p>
          </div>
        )}

        {step === "form" && order && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>12-Month Warranty:</strong> Claims accepted for faulty or stopped-working products within 12 months of shipment.
                Items with physical damage are not covered. Resolution is exchange or refund at our discretion.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4 mb-4">
              <p className="text-sm font-semibold text-neutral-700">Order: {order.id}</p>
              <p className="text-xs text-neutral-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Select Items</label>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div key={item.idx} className={`flex items-center gap-3 rounded-xl border p-3 ${item.selected ? "border-accent bg-accent/5" : "border-neutral-200 bg-white"}`}>
                      <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.idx)} className="h-5 w-5 rounded border-neutral-300" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{item.name || item.productName || "Item"}</p>
                        <p className="text-xs text-neutral-500">Qty ordered: {item.quantity}</p>
                      </div>
                      {item.selected && item.quantity > 1 && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-neutral-500">Qty:</label>
                          <input
                            type="number" min="1" max={item.quantity || 1} value={item.returnQty}
                            onChange={(e) => updateQty(item.idx, parseInt(e.target.value) || 1)}
                            className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Reason *</label>
                <select
                  value={reason} onChange={(e) => setReason(e.target.value)} required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">Select a reason...</option>
                  {RETURN_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Describe the Issue *</label>
                <textarea
                  value={reasonDetails} onChange={(e) => setReasonDetails(e.target.value)} required
                  placeholder="When did it start? What happens? Any error codes?"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-accent focus:outline-none min-h-[90px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Photos <span className="text-neutral-400 font-normal">(up to {MAX_PHOTOS})</span>
                </label>
                <div className="space-y-2">
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {photos.map((src, i) => (
                        <div key={i} className="relative">
                          <img src={src} alt={`photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-neutral-200" />
                          <button type="button" onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photos.length < MAX_PHOTOS && (
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500 hover:border-accent hover:text-accent transition">
                      <span>+ Add photo{photos.length > 0 ? ` (${photos.length}/${MAX_PHOTOS})` : ""}</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                    </label>
                  )}
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
              )}

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800">
                  <strong>Return shipping is at your expense.</strong> Once approved, we&apos;ll email you the return address.
                  Inspection takes 10–15 business days after we receive the item.
                </p>
              </div>

              <div className="flex gap-3 pt-2 border-t border-neutral-200">
                <button type="button" onClick={() => setStep("lookup")} className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition">
                  Back
                </button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition disabled:opacity-60">
                  {submitting ? "Submitting…" : "Submit Warranty Claim"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
