import type { Metadata } from "next";
import HomePage from "./_components/HomePage";
import { getSiteUrl } from "@/lib/site-url";
import { getServerProducts } from "@/lib/server-products";

export const metadata: Metadata = {
  title: "Garage Door Remotes & Gate Remotes Australia | ALLREMOTES",
  description:
    "Buy replacement garage door remotes, gate remotes and access control products online. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast shipping Australia-wide, 30-day returns, 12-month warranty.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Garage Door Remotes & Gate Remotes Australia | ALLREMOTES",
    description:
      "Buy replacement garage door remotes, gate remotes and access control products online. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast shipping, 30-day returns, 12-month warranty.",
    url: "/",
  },
};

function OrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "All Remotes",
    legalName: "ALL REMOTES PTY LTD",
    url: siteUrl,
    logo: `${siteUrl}/images/mainlogo.png`,
    description:
      "Australian-owned online retailer of replacement garage door remotes, gate remotes, and access control products.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "32 Bell Street",
      addressLocality: "Yarra Glen",
      addressRegion: "Victoria",
      postalCode: "3775",
      addressCountry: "AU",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "shane@allremotes.com.au",
      availableLanguage: "English",
      areaServed: "AU",
    },
    sameAs: [siteUrl],
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ALLREMOTES Australia",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/products/all?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const store = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "All Remotes",
    legalName: "ALL REMOTES PTY LTD",
    image: `${siteUrl}/images/mainlogo.png`,
    url: siteUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: "32 Bell Street",
      addressLocality: "Yarra Glen",
      addressRegion: "Victoria",
      postalCode: "3775",
      addressCountry: "AU",
    },
    email: "shane@allremotes.com.au",
    priceRange: "$$",
    currenciesAccepted: "AUD",
    paymentAccepted: "Credit Card, Debit Card, Apple Pay, Google Pay",
    areaServed: "AU",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003C") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, "\\u003C") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(store).replace(/</g, "\\u003C") }}
      />
    </>
  );
}

export default async function Home() {
  const initialProducts = await getServerProducts();
  return (
    <>
      <OrganizationJsonLd />
      <HomePage initialProducts={initialProducts} />
    </>
  );
}
