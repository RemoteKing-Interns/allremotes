import React, { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductListClient from "../../products/_components/ProductListClient";
import { getSiteUrl } from "@/lib/site-url";
import { getServerProducts } from "@/lib/server-products";

const PRIORITY_BRANDS = [
  "Merlin",
  "ATA",
  "B&D",
  "Chamberlain",
  "Gliderol",
  "Elsema",
  "Centurion",
  "Hormann",
  "Steel-Line",
];

function normalizeBrandParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getBrandTitle(brand: string) {
  if (brand === "Merlin") return "Merlin Garage Door Remotes Australia | ALLREMOTES";
  if (brand === "B&D") return "B&D Garage Door Remotes Australia | ALLREMOTES";
  return `${brand} Remote Controls | ALLREMOTES Australia`;
}

function getBrandH1(brand: string) {
  if (brand === "Merlin") return "Merlin Garage Door Remotes";
  if (brand === "B&D") return "B&D Garage Door Remotes";
  return `${brand} Remote Controls`;
}

function getBrandDescription(brand: string) {
  const brandSeoCopy: Record<string, string> = {
    Merlin:
      "Buy Merlin garage door remotes online in Australia. Compatible replacement remotes for Merlin E960M, E970M, E964M, E8003, MR800A, MT100EVO and Merlin+ range. 433MHz rolling code, 12-month warranty, fast shipping.",
    ATA:
      "Buy ATA garage door remotes online in Australia. Compatible replacement remotes for ATA PTX5, PTX4, PTX6 and SecuraCode openers. Rolling code, 12-month warranty, fast shipping.",
    "B&D":
      "Buy B&D garage door remotes online in Australia. Compatible replacement remotes for B&D Tri-Tran, Tri-Tran+ and Controll-A-Door openers. 12-month warranty, fast shipping nationwide.",
    Chamberlain:
      "Buy Chamberlain garage door remotes online in Australia. Compatible replacement remotes for Chamberlain, LiftMaster and MotorLift openers. 12-month warranty, fast shipping.",
    Gliderol:
      "Buy Gliderol garage door remotes online in Australia. Compatible replacement remotes for Gliderol GTS, GTA and GRD series openers. 12-month warranty, fast shipping nationwide.",
    Steel_Line:
      "Buy Steel-Line garage door remotes online in Australia. Compatible replacement remotes for Steel-Line openers. 12-month warranty, fast shipping nationwide.",
    Elsema:
      "Buy Elsema gate and garage remotes online in Australia. Compatible replacement remotes for Elsema 433MHz receivers. 12-month warranty, fast shipping.",
    Centurion:
      "Buy Centurion gate remotes online in Australia. Compatible replacement remotes for Centurion sliding and swing gate motors. 12-month warranty, fast shipping.",
    Hormann:
      "Buy Hormann garage door remotes online in Australia. Compatible replacement remotes for Hormann openers. 12-month warranty, fast shipping nationwide.",
  };
  const key = brand.replace(/[^a-zA-Z&]/g, "").replace(/&/g, "D");
  return (
    brandSeoCopy[key] ||
    `Shop ${brand} garage door and gate remote controls at ALLREMOTES Australia. Find compatible ${brand} remote replacements with fast local shipping, warranty and expert support.`
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: rawBrand } = await params;
  const brand = normalizeBrandParam(rawBrand);
  const title = getBrandTitle(brand);
  const description = getBrandDescription(brand);
  const canonical = `/brands/${encodeURIComponent(brand)}`;

  return {
    title,
    description,
    keywords: [
      `${brand} remote`,
      `${brand} garage door remote`,
      `${brand} gate remote`,
      "remote control",
      "replacement remote",
      "Australia",
    ],
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

function BrandSeoContent({ brand }: { brand: string }) {
  if (brand === "Merlin") {
    return (
      <div className="space-y-8">
        <div className="max-w-3xl">
          <p className="text-base leading-8 text-neutral-600 sm:text-lg">
            Buy Merlin garage door remotes online in Australia. ALLREMOTES stocks compatible replacement remotes for the full Merlin range, including the E960M, E970M, E964M, E8003, MR800A, MT100EVO and Merlin+ series. All remotes use Merlin's 433MHz rolling code technology and come with a 12-month warranty.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
            Merlin Remote Models We Stock
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border border-neutral-200 rounded-lg overflow-hidden">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Remote Model</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Compatible Openers</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr><td className="px-4 py-3 font-medium">Merlin E960M</td><td className="px-4 py-3 text-neutral-600">Merlin+ 2.0, Silent Drive, MT800A</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Merlin E970M</td><td className="px-4 py-3 text-neutral-600">Merlin+ 2.0, MT100EVO, MT800A</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Merlin E964M</td><td className="px-4 py-3 text-neutral-600">Merlin+ 2.0, Silent Drive</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Merlin E8003</td><td className="px-4 py-3 text-neutral-600">Merlin 800, older Merlin openers</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Merlin MR800A</td><td className="px-4 py-3 text-neutral-600">MR800A, MR850</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Merlin MT100EVO</td><td className="px-4 py-3 text-neutral-600">MT100EVO, MT800A</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <h3 className="font-semibold text-neutral-900">Programming a Merlin Remote</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Press the learn button on your Merlin motor unit, then press a button on your new remote within 10 seconds. The motor light will flash to confirm pairing. See our{" "}
              <Link href="/support/merlin-remote-wont-program" className="font-semibold text-primary hover:underline">Merlin troubleshooting guide</Link>{" "}
              if you have issues.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <h3 className="font-semibold text-neutral-900">Merlin Remote Battery</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Most Merlin remotes use a CR2032 coin cell battery. If your remote range drops or stops working, replace the battery first before assuming the remote is faulty.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/products/garage" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">Shop All Garage Remotes</Link>
          <Link href="/support/which-garage-door-remote-do-i-need" className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Which Remote Do I Need?</Link>
          <Link href="/garage-door-remotes" className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Garage Door Remotes Guide</Link>
        </div>
      </div>
    );
  }

  if (brand === "B&D") {
    return (
      <div className="space-y-8">
        <div className="max-w-3xl">
          <p className="text-base leading-8 text-neutral-600 sm:text-lg">
            Buy B&D garage door remotes online in Australia. ALLREMOTES stocks compatible replacement remotes for B&D Controll-A-Door, Tri-Tran and Tri-Tran+ openers. All remotes come with a 12-month warranty and ship Australia-wide.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
            B&D Remote Compatibility Guide
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border border-neutral-200 rounded-lg overflow-hidden">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Opener Model</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Compatible Remotes</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr><td className="px-4 py-3 font-medium">Controll-A-Door S</td><td className="px-4 py-3 text-neutral-600">B&D Tri-Tran+ compatible</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Controll-A-Door 4</td><td className="px-4 py-3 text-neutral-600">B&D 4-button remote</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Controll-A-Door 5</td><td className="px-4 py-3 text-neutral-600">B&D Tri-Tran+ compatible</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Roller Door Opener</td><td className="px-4 py-3 text-neutral-600">B&D roller door remote</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
                <tr><td className="px-4 py-3 font-medium">Panel Lift</td><td className="px-4 py-3 text-neutral-600">B&D Tri-Tran+ compatible</td><td className="px-4 py-3 text-neutral-600">433MHz</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <h3 className="font-semibold text-neutral-900">Programming a B&D Remote</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Press and hold the learn button on your B&D motor until the LED flashes, then press a button on your new remote. The motor will confirm with a click or flash.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <h3 className="font-semibold text-neutral-900">B&D Tri-Tran+ vs Original</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Tri-Tran+ is B&D's rolling code technology operating on 433MHz. Our compatible remotes use the same technology, providing the same range and security as the original.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/products/garage" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">Shop All Garage Remotes</Link>
          <Link href="/roller-door-remotes" className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Roller Door Remotes</Link>
          <Link href="/support/which-garage-door-remote-do-i-need" className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Which Remote Do I Need?</Link>
        </div>
      </div>
    );
  }

  // Default content for other brands
  return (
    <div className="max-w-3xl">
      <p className="text-base leading-8 text-neutral-600 sm:text-lg">
        {getBrandDescription(brand)}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/products/garage" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">Shop All Garage Remotes</Link>
        <Link href="/support/which-garage-door-remote-do-i-need" className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Which Remote Do I Need?</Link>
      </div>
    </div>
  );
}

function BrandJsonLd({ brand }: { brand: string }) {
  const siteUrl = getSiteUrl();
  const brandUrl = `${siteUrl}/brands/${encodeURIComponent(brand)}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${brand} Remote Controls`,
      url: brandUrl,
      description: getBrandDescription(brand),
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
          name: `${brand} Remotes`,
          item: brandUrl,
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

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: rawBrand } = await params;
  const brand = normalizeBrandParam(rawBrand);

  const validatedBrand = PRIORITY_BRANDS.includes(brand) ? brand : null;
  if (!validatedBrand) {
    notFound();
  }

  const initialProducts = await getServerProducts();

  return (
    <>
      {/* SEO content above product grid */}
      <section className="bg-neutral-50 py-12 sm:py-16 lg:py-20">
        <div className="container">
          <nav className="mb-6 text-sm text-neutral-500">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/shop-by-brand" className="hover:text-primary">Brands</Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-900">{brand}</span>
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
            {getBrandH1(brand)}
          </h1>
          <div className="mt-8">
            <BrandSeoContent brand={brand} />
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="container py-8 sm:py-10">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 p-7 shadow-panel backdrop-blur sm:p-10">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {getBrandH1(brand)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                {getBrandDescription(brand)}
              </p>
            </div>
          </div>
        }
      >
        <ProductListClient
          routeCategory="all"
          routeBrand={validatedBrand}
          initialProducts={initialProducts}
        />
      </Suspense>
      <BrandJsonLd brand={brand} />
    </>
  );
}
