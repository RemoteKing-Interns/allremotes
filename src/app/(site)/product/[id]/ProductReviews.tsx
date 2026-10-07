"use client";

import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

type Review = {
  name: string;
  rating: number;
  text: string;
  verifiedPurchase?: boolean;
  createdAt?: string;
};

type Summary = { average: number | null; count: number };

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-neutral-300"}
        />
      ))}
    </span>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary>({ average: null, count: 0 });
  const [loaded, setLoaded] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.email && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.email]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/product-reviews?productId=${encodeURIComponent(productId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setReviews(data.reviews || []);
        setSummary(data.summary || { average: null, count: 0 });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!rating) {
      setError("Please choose a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/product-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, email, rating, text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not save your review");
      } else {
        setSubmitted(true);
        setShowForm(false);
        const refreshed = await fetch(`/api/product-reviews?productId=${encodeURIComponent(productId)}`);
        if (refreshed.ok) {
          const data2 = await refreshed.json();
          setReviews(data2.reviews || []);
          setSummary(data2.summary || { average: null, count: 0 });
        }
      }
    } catch {
      setError("Could not save your review right now");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded && summary.count === 0) {
    return <div className="mt-10" aria-hidden="true" />;
  }

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Customer Reviews</h2>
        {summary.count > 0 && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Stars value={summary.average || 0} />
            <span className="font-semibold text-neutral-900">{summary.average?.toFixed(1)}</span>
            <span>({summary.count} {summary.count === 1 ? "review" : "reviews"})</span>
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <ul className="mt-4 grid gap-4">
          {reviews.map((review, i) => (
            <li key={i} className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">{review.name}</span>
                  {review.verifiedPurchase && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      Verified purchase
                    </span>
                  )}
                </div>
                <Stars value={review.rating} />
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-700">{review.text}</p>
            </li>
          ))}
        </ul>
      )}

      {summary.count === 0 && loaded && (
        <p className="mt-3 text-sm text-neutral-500">
          No reviews yet — bought this remote? Tell others how it went.
        </p>
      )}

      {submitted ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Thanks! Your review has been published.
        </p>
      ) : showForm ? (
        <form onSubmit={submit} className="mt-5 grid max-w-xl gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email used for your order"
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              required
            />
          </div>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={rating === i}
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i)}
                className="p-0.5"
              >
                <Star
                  size={22}
                  className={
                    i <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-300"
                  }
                />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Did it work with your door? How was the programming? (min 5 characters)"
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            required
          />
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <p className="text-xs text-neutral-500">
            Reviews are limited to verified buyers — we match your email to an order for this product.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-extrabold text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 inline-flex w-fit items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-extrabold text-neutral-800 shadow-xs hover:bg-neutral-100"
        >
          Write a Review
        </button>
      )}
    </section>
  );
}
