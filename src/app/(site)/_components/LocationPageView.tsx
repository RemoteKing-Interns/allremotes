import React from "react";
import Link from "next/link";
import type { LocationPage } from "@/lib/location-pages";
import { buildLocationJsonLd } from "@/lib/location-pages";

export function LocationPageView({ page }: { page: LocationPage }) {
  const jsonLd = buildLocationJsonLd(page);

  return (
    <>
      <main className="animate-fadeIn">
        <section className="bg-neutral-50 py-12 sm:py-16 lg:py-20">
          <div className="container">
            <nav className="mb-6 text-sm text-neutral-500">
              <Link href="/" className="hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-neutral-900">{page.h1}</span>
            </nav>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              {page.h1}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-600 sm:text-lg">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products/garage"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.98]"
              >
                Shop Garage &amp; Gate Remotes
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-4xl space-y-8">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                  Replacement Remotes Delivered to {page.city}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-neutral-600 sm:text-base sm:leading-8">
                  <p>
                    At ALLREMOTES, we ship replacement garage door and gate remotes to {page.city} and surrounding areas with fast, tracked delivery. Whether you&apos;ve lost your remote, need a spare, or your existing remote has stopped working, we have compatible replacements for all major brands including{" "}
                    <Link href="/brands/Merlin" className="font-semibold text-primary hover:underline">Merlin</Link>,{" "}
                    <Link href="/brands/ATA" className="font-semibold text-primary hover:underline">ATA</Link>,{" "}
                    <Link href="/brands/B%26D" className="font-semibold text-primary hover:underline">B&amp;D</Link>,{" "}
                    <Link href="/brands/Chamberlain" className="font-semibold text-primary hover:underline">Chamberlain</Link>,{" "}
                    <Link href="/brands/Gliderol" className="font-semibold text-primary hover:underline">Gliderol</Link>{" "}
                    and more.
                  </p>
                  <p>
                    Based in Yarra Glen, Victoria, we dispatch orders placed before 2pm AEST the same business day. Standard delivery to {page.city} metro typically takes 2-5 business days. Express shipping is available at checkout for urgent orders.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                  Why Choose ALLREMOTES for Your Replacement Remote?
                </h2>
                <ul className="mt-4 ml-4 list-disc space-y-2 text-sm leading-7 text-neutral-600 sm:text-base">
                  <li><strong>Australian-owned</strong> — based in Victoria, shipping nationwide</li>
                  <li><strong>12-month warranty</strong> on all remotes and accessories</li>
                  <li><strong>30-day returns</strong> — shop with confidence</li>
                  <li><strong>Same-day dispatch</strong> for orders before 2pm AEST</li>
                  <li><strong>Expert support</strong> — help identifying the right remote for your motor</li>
                  <li><strong>Quality-tested</strong> — every remote is pre-tested before dispatch</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                  Popular Remote Brands in {page.city}
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/brands/Merlin" className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-xs transition hover:border-primary/30 hover:text-primary">Merlin Remotes</Link>
                  <Link href="/brands/ATA" className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-xs transition hover:border-primary/30 hover:text-primary">ATA Remotes</Link>
                  <Link href="/brands/B%26D" className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-xs transition hover:border-primary/30 hover:text-primary">B&amp;D Remotes</Link>
                  <Link href="/brands/Chamberlain" className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-xs transition hover:border-primary/30 hover:text-primary">Chamberlain Remotes</Link>
                  <Link href="/brands/Gliderol" className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-xs transition hover:border-primary/30 hover:text-primary">Gliderol Remotes</Link>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
                <h2 className="text-xl font-semibold text-neutral-900">Ready to Order?</h2>
                <p className="mt-3 text-sm text-neutral-600 sm:text-base">
                  Browse our full range of compatible replacement remotes with fast delivery to {page.city}.
                </p>
                <Link
                  href="/products/all"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.98]"
                >
                  Shop All Products
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003C") }}
      />
    </>
  );
}

export function buildLocationMetadata(page: LocationPage) {
  const canonical = `/${page.slug}`;
  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      type: "website" as const,
      locale: "en_AU",
      siteName: "ALLREMOTES Australia",
      url: canonical,
      images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: page.title,
      description: page.metaDescription,
      images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
    },
  };
}
