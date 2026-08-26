import React from "react";
import Link from "next/link";
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import { buildLandingPageJsonLd } from "@/lib/seo-landing-pages";

export function SeoLandingPageView({ page }: { page: SeoLandingPage }) {
  const jsonLd = buildLandingPageJsonLd(page);

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
                href={page.ctaLink}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.98]"
              >
                {page.ctaText}
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-4xl space-y-10">
              {page.sections.map((section, i) => (
                <div key={i}>
                  <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                    {section.heading}
                  </h2>
                  <div className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base sm:leading-8">
                    {section.body}
                  </div>
                </div>
              ))}

              {page.faqs.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                    Frequently Asked Questions
                  </h2>
                  <div className="mt-6 space-y-6">
                    {page.faqs.map((faq, i) => (
                      <div key={i}>
                        <h3 className="text-base font-semibold text-neutral-900">{faq.question}</h3>
                        <p className="mt-2 text-sm leading-7 text-neutral-600 sm:text-base">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
                <h2 className="text-xl font-semibold text-neutral-900">Ready to Find Your Remote?</h2>
                <p className="mt-3 text-sm text-neutral-600 sm:text-base">
                  Browse our full range of compatible replacement remotes with fast Australia-wide shipping.
                </p>
                <Link
                  href={page.ctaLink}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark active:scale-[0.98]"
                >
                  {page.ctaText}
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

export function buildLandingMetadata(page: SeoLandingPage) {
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
      images: [{ url: "/images/3.jpg" }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: page.title,
      description: page.metaDescription,
      images: [{ url: "/images/3.jpg" }],
    },
  };
}
