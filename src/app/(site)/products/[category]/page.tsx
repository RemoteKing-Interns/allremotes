import React, { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductListClient from "../_components/ProductListClient";
import { getCategoryPageTitle } from "@/lib/category";
import { getSiteUrl } from "@/lib/site-url";
import { getServerProducts } from "@/lib/server-products";

const REMOVED_CATEGORIES = new Set(["car", "automotive", "auto", "vehicle"]);

function redirectIfRemoved(category: string) {
  if (REMOVED_CATEGORIES.has(category.toLowerCase())) {
    redirect("/products/all");
  }
}

function getCategoryDescription(category: string) {
  const descriptions: Record<string, string> = {
    garage:
      "Buy garage door remotes and garage remote controls online in Australia. Compatible replacement remotes for Merlin, B&D, ATA, Chamberlain, Gliderol, Steel-Line and more. 12-month warranty, fast Australia-wide shipping.",
    home:
      "Discover home remotes for TVs, air conditioners, ceiling fans, alarms and more at ALLREMOTES Australia.",
    locksmith:
      "Browse locksmith tools, key programmers, picks, decoders and key-cutting accessories at ALLREMOTES Australia.",
  };
  return (
    descriptions[category] ||
    "Browse our complete range of replacement remotes, receivers and accessories at ALLREMOTES Australia."
  );
}

function getCategoryTitle(category: string) {
  if (category === "garage") {
    return "Garage Remotes Australia | Garage Door Remote Controls | ALLREMOTES";
  }
  const display = getCategoryPageTitle(category);
  return `${display} Remotes for Sale Australia | ALLREMOTES`;
}

function getCategoryH1(category: string) {
  if (category === "garage") {
    return "Garage Remotes & Garage Door Remote Controls";
  }
  return `${getCategoryPageTitle(category)} Remotes`;
}

function getCategoryKeywords(category: string) {
  if (category === "garage") {
    return [
      "garage remotes",
      "garage door remotes",
      "garage remote control",
      "garage door remote control",
      "garage door remote",
      "garage opener remote",
      "garage remote",
      "garage door opener remote",
      "garage remote controls",
      "replacement garage door remote",
      "garage remote replacement",
      "buy garage door remotes",
      "roller door remotes",
      "garage remotes australia",
    ];
  }
  return ["remote", "remotes", `${category} remote`, "Australia", "replacement remote"];
}

const GARAGE_FAQS = [
  {
    question: "How do I know which garage door remote to buy?",
    answer:
      "Check your motor unit for the brand name and model number, then browse our brand pages to find the matching remote. If you're unsure, use our remote identification guide or email us a photo of your existing remote for help.",
  },
  {
    question: "Are these remotes compatible with my garage door motor?",
    answer:
      "Yes. All our remotes are compatible replacements for the specific motor brands and models listed on each product page. Check the compatibility list on the product page or use our remote identification guide.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Orders placed before 2pm AEST ship the same business day. Standard delivery takes 2-5 business days to most Australian addresses. Express shipping is available at checkout.",
  },
  {
    question: "Do the remotes come with a warranty?",
    answer:
      "Yes, all remotes come with a 12-month warranty. If your remote stops working within the warranty period, contact us for a replacement.",
  },
  {
    question: "Can I program the garage remote myself?",
    answer:
      "Yes, most remotes can be programmed in under five minutes. Each remote includes programming instructions, and our support guides have step-by-step instructions for each brand.",
  },
  {
    question: "What's the difference between original and replacement remotes?",
    answer:
      "Original remotes are made by the motor manufacturer (e.g. Merlin, B&D). Replacement remotes are third-party compatible remotes that use the same frequency and coding technology. Our replacement remotes are quality-tested and come with a 12-month warranty.",
  },
];

function GarageSeoContent() {
  return (
    <div className="space-y-10">
      {/* Intro */}
      <div className="max-w-3xl">
        <p className="text-base leading-8 text-neutral-600 sm:text-lg">
          Buy garage door remotes online in Australia. ALLREMOTES stocks compatible replacement garage remotes for every major brand —{" "}
          <Link href="/brands/Merlin" className="font-semibold text-primary hover:underline">Merlin</Link>,{" "}
          <Link href="/brands/B%26D" className="font-semibold text-primary hover:underline">B&amp;D</Link>,{" "}
          <Link href="/brands/ATA" className="font-semibold text-primary hover:underline">ATA</Link>,{" "}
          <Link href="/brands/Chamberlain" className="font-semibold text-primary hover:underline">Chamberlain</Link>,{" "}
          <Link href="/brands/Gliderol" className="font-semibold text-primary hover:underline">Gliderol</Link>{" "}
          and Steel-Line. All remotes are quality-tested with a 12-month warranty and shipped Australia-wide from our Yarra Glen warehouse.
        </p>
      </div>

      {/* Shop by Brand */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          Shop Garage Remotes by Brand
        </h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { name: "Merlin", slug: "Merlin", desc: "E960M, E970M, E964M, MR800A" },
            { name: "B&D", slug: "B%26D", desc: "Tri-Tran+, Controll-A-Door" },
            { name: "ATA", slug: "ATA", desc: "PTX5, PTX4, SecuraCode" },
            { name: "Chamberlain", slug: "Chamberlain", desc: "LiftMaster, MotorLift" },
            { name: "Gliderol", slug: "Gliderol", desc: "GTS, GTA, GRD series" },
            { name: "Steel-Line", slug: "Steel-Line", desc: "Steel-Line openers" },
            { name: "Centurion", slug: "Centurion", desc: "Gate & garage motors" },
            { name: "Elsema", slug: "Elsema", desc: "433MHz receivers" },
          ].map((brand) => (
            <Link
              key={brand.name}
              href={`/brands/${brand.slug}`}
              className="group rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary hover:shadow-soft"
            >
              <p className="font-semibold text-neutral-900 group-hover:text-primary">{brand.name}</p>
              <p className="mt-1 text-xs text-neutral-500">{brand.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Garage Door Remote Replacement */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          Garage Door Remote Replacement
        </h2>
        <div className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
          <p className="mb-3">
            Lost or broken your garage door remote? Replacing it is straightforward. Follow these steps to find the right replacement:
          </p>
          <ol className="ml-5 list-decimal space-y-2">
            <li>
              <strong>Find the opener brand</strong> — Check the motor unit on your garage ceiling for a brand label (Merlin, B&D, ATA, etc.).
            </li>
            <li>
              <strong>Find the model number</strong> — Look for a model number on the motor unit or the back of your existing remote.
            </li>
            <li>
              <strong>Compare your old remote</strong> — Note the number of buttons, colour, and shape to match it to our products.
            </li>
            <li>
              <strong>Check frequency</strong> — Most Australian garage remotes use 433MHz. Check the label on your remote or motor.
            </li>
            <li>
              <strong>Select and order</strong> — Browse the matching{" "}
              <Link href="/shop-by-brand" className="font-semibold text-primary hover:underline">brand page</Link>{" "}
              or use our{" "}
              <Link href="/support/which-garage-door-remote-do-i-need" className="font-semibold text-primary hover:underline">remote finder guide</Link>.
            </li>
          </ol>
          <p className="mt-3">
            Need help? Read our full{" "}
            <Link href="/replacement-garage-remotes" className="font-semibold text-primary hover:underline">replacement garage remotes guide</Link>{" "}
            or{" "}
            <Link href="/contact" className="font-semibold text-primary hover:underline">contact us</Link>{" "}
            with a photo of your remote.
          </p>
        </div>
      </div>

      {/* Internal links grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/garage-door-remotes" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 transition hover:border-primary hover:bg-white">
          <h3 className="font-semibold text-neutral-900">Garage Door Remotes</h3>
          <p className="mt-1 text-sm text-neutral-500">Complete guide to garage door remote controls in Australia.</p>
        </Link>
        <Link href="/roller-door-remotes" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 transition hover:border-primary hover:bg-white">
          <h3 className="font-semibold text-neutral-900">Roller Door Remotes</h3>
          <p className="mt-1 text-sm text-neutral-500">Replacement remotes for roller door openers.</p>
        </Link>
        <Link href="/gate-remotes" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 transition hover:border-primary hover:bg-white">
          <h3 className="font-semibold text-neutral-900">Gate Remotes</h3>
          <p className="mt-1 text-sm text-neutral-500">Remotes for automatic swing gates, sliding gates and barrier arms.</p>
        </Link>
        <Link href="/support/which-garage-door-remote-do-i-need" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 transition hover:border-primary hover:bg-white">
          <h3 className="font-semibold text-neutral-900">Which Remote Do I Need?</h3>
          <p className="mt-1 text-sm text-neutral-500">Step-by-step guide to identifying your garage door remote.</p>
        </Link>
        <Link href="/garage-remotes-melbourne" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 transition hover:border-primary hover:bg-white">
          <h3 className="font-semibold text-neutral-900">Garage Remotes Melbourne</h3>
          <p className="mt-1 text-sm text-neutral-500">Fast delivery to Melbourne metro and regional VIC.</p>
        </Link>
        <Link href="/garage-remotes-sydney" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 transition hover:border-primary hover:bg-white">
          <h3 className="font-semibold text-neutral-900">Garage Remotes Sydney</h3>
          <p className="mt-1 text-sm text-neutral-500">Fast delivery to Sydney metro and regional NSW.</p>
        </Link>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          Garage Remote FAQs
        </h2>
        <div className="mt-6 space-y-6">
          {GARAGE_FAQS.map((faq, i) => (
            <div key={i}>
              <h3 className="text-base font-semibold text-neutral-900">{faq.question}</h3>
              <p className="mt-2 text-sm leading-7 text-neutral-600 sm:text-base">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GarageFaqJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: GARAGE_FAQS.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }).replace(/</g, "\u003C"),
      }}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  redirectIfRemoved(category);
  const title = getCategoryTitle(category);
  const description = getCategoryDescription(category);
  const keywords = getCategoryKeywords(category);
  const canonical = `/products/${category}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_AU",
      siteName: "ALLREMOTES Australia",
      url: canonical,
      images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
    },
  };
}

function CategoryJsonLd({ category }: { category: string }) {
  const siteUrl = getSiteUrl();
  const title = getCategoryTitle(category).split(" | ")[0];
  const description = getCategoryDescription(category);
  const categoryUrl = `${siteUrl}/products/${category}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: categoryUrl,
      description,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: categoryUrl,
        },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, '\\u003C') }}
    />
  );
}

export default async function ProductsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  redirectIfRemoved(category);
  const initialProducts = await getServerProducts();
  const isGarage = category === "garage";
  return (
    <>
      {/* SEO content above product grid for garage category */}
      {isGarage && (
        <section className="bg-neutral-50 py-12 sm:py-16 lg:py-20">
          <div className="container">
            <nav className="mb-6 text-sm text-neutral-500">
              <Link href="/" className="hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-neutral-900">Garage Remotes</span>
            </nav>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              {getCategoryH1(category)}
            </h1>
            <div className="mt-8">
              <GarageSeoContent />
            </div>
          </div>
        </section>
      )}

      <Suspense
        fallback={
          <div className="container py-8 sm:py-10">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 p-7 shadow-panel backdrop-blur sm:p-10">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {getCategoryH1(category)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                {getCategoryDescription(category)}
              </p>
            </div>
          </div>
        }
      >
        <ProductListClient routeCategory={category} initialProducts={initialProducts} />
      </Suspense>
      <CategoryJsonLd category={category} />
      {isGarage && <GarageFaqJsonLd />}
    </>
  );
}
