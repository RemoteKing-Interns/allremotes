"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Get in Touch
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Have a question about our products or need help finding the right remote? Our friendly team is here to help.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact Info - Left Side */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Email Card */}
            <div className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Email</h3>
              <a href="mailto:support@allremotes.com" className="mt-1 block text-lg font-semibold text-neutral-900 hover:text-primary transition-colors">
                support@allremotes.com
              </a>
              <p className="mt-1 text-sm text-neutral-500">We typically respond within 2-4 hours</p>
            </div>

            {/* Phone Card */}
            <div className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Phone</h3>
              <a href="tel:1800REMOTES" className="mt-1 block text-lg font-semibold text-neutral-900 hover:text-primary transition-colors">
                1-800-REMOTES
              </a>
              <p className="mt-1 text-sm text-neutral-500">Call us during business hours</p>
            </div>

            {/* Business Hours Card */}
            <div className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Business Hours</h3>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Monday – Friday</span>
                  <span className="font-semibold text-neutral-900">9:00 AM – 5:00 PM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Saturday</span>
                  <span className="font-semibold text-neutral-900">10:00 AM – 2:00 PM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Sunday</span>
                  <span className="font-semibold text-neutral-500">Closed</span>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Location</h3>
              <p className="mt-1 text-base font-semibold text-neutral-900">Australia-wide Service</p>
              <p className="mt-1 text-sm text-neutral-500">We ship to all states and territories</p>
            </div>
          </div>

          {/* Contact Form - Right Side */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Send us a Message</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Fill out the form below and we&apos;ll get back to you as soon as possible.
              </p>

              {submitted && (
                <div className="mt-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Thank you! Your message has been sent successfully.
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-semibold text-neutral-700">
                      Your Name <span className="text-primary">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-neutral-700">
                      Email Address <span className="text-primary">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-neutral-700">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    className="h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-semibold text-neutral-700">
                    Your Message <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full resize-none rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Tell us what you need help with..."
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Send Message
                </button>
              </form>
            </div>

            {/* FAQ teaser */}
            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500 shadow-sm border border-neutral-200">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Looking for quick answers?</h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    Check our support section for FAQs about shipping, returns, warranty, and compatibility guides.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
