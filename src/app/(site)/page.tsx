import type { Metadata } from "next";
import HomePage from "./_components/HomePage";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "ALLREMOTES Australia | Garage, Gate & Home Replacement Remotes",
  description:
    "Shop replacement garage door remotes, gate remotes, home automation remotes, keyless entry and accessories at ALLREMOTES Australia. Fast shipping, 30-day returns and expert support.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ALLREMOTES Australia | Garage, Gate & Home Replacement Remotes",
    description:
      "Shop replacement garage door remotes, gate remotes, home automation remotes and accessories. Fast shipping, 30-day returns and expert support.",
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
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003C") }}
    />
  );
}

export default function Home() {
  return (
    <>
      <OrganizationJsonLd />
      <HomePage />
    </>
  );
}
