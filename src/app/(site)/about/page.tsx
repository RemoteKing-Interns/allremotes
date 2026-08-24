import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About All Remotes | Australian Remote Control Specialists",
  description:
    "All Remotes Pty Ltd (ABN 23 679 611 351) is an Australian-owned online retailer of replacement garage door remotes, gate remotes and accessories. Based in Yarra Glen, Victoria.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            About All Remotes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Your trusted Australian source for replacement garage door remotes, gate remotes, and access control products.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-neutral-900">Our Story</h2>
            <p className="mt-4 text-neutral-600 leading-relaxed">
              All Remotes Pty Ltd (ABN 23 679 611 351) is a 100% Australian-owned and operated online retailer
              specialising in replacement garage door remotes, gate remotes, keyless entry systems, and
              locksmithing tools. Based in Yarra Glen, Victoria, we ship Australia-wide and pride ourselves on
              expert local support and fast delivery.
            </p>
            <p className="mt-4 text-neutral-600 leading-relaxed">
              We understand how frustrating it can be to lose or break a remote control. That&apos;s why we stock
              a comprehensive range of genuine and aftermarket remotes compatible with all major Australian
              garage door and gate brands, including Merlin, ATA, B&amp;D, Chamberlain, Gliderol, Elsema,
              Centurion, Hormann, and many more.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900">Why Shop With Us?</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-neutral-900">Australian Owned &amp; Operated</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  We&apos;re a local business based in Yarra Glen, Victoria. When you contact us, you speak to
                  a real person who understands Australian garage door systems.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-neutral-900">Fast Australia-Wide Shipping</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Free standard shipping on all orders. Express options available. Orders dispatched within
                  1 business day from our Victorian warehouse.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-neutral-900">30-Day Returns</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Not the right remote? No problem. We offer 30-day returns on most items, provided they&apos;re
                  in original, resaleable condition.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-neutral-900">12-Month Warranty</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Every remote we sell comes with a 12-month warranty for your peace of mind. Quality tested
                  before dispatch.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900">Business Details</h2>
            <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wider text-neutral-500">Company Name</dt>
                  <dd className="mt-1 text-neutral-900">ALL REMOTES PTY LTD</dd>
                </div>
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wider text-neutral-500">ABN</dt>
                  <dd className="mt-1 text-neutral-900">23 679 611 351</dd>
                </div>
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wider text-neutral-500">Address</dt>
                  <dd className="mt-1 text-neutral-900">32 Bell Street, Yarra Glen, Victoria 3775</dd>
                </div>
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wider text-neutral-500">Email</dt>
                  <dd className="mt-1">
                    <a href="mailto:shane@allremotes.com.au" className="text-primary hover:underline">
                      shane@allremotes.com.au
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wider text-neutral-500">Hours</dt>
                  <dd className="mt-1 text-neutral-900">Mon &ndash; Fri, 9:00 AM &ndash; 4:00 PM AEST</dd>
                </div>
                <div>
                  <dt className="text-sm font-bold uppercase tracking-wider text-neutral-500">GST Status</dt>
                  <dd className="mt-1 text-neutral-900">Registered for GST</dd>
                </div>
              </dl>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900">Contact Us</h2>
            <p className="mt-4 text-neutral-600">
              Have a question about compatibility, shipping, or a warranty claim? Our friendly team is here to help.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                Contact Us
              </Link>
              <Link
                href="/support"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-sm font-bold text-neutral-900 shadow-sm transition-colors hover:border-primary hover:text-primary"
              >
                Support Center
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
