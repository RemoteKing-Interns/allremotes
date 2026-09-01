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
  const reviews = [
    { author: "James M.", city: "Melbourne, VIC", rating: 5, text: "Excellent service and fast delivery! The remote I ordered worked perfectly with my garage door. Highly recommend ALLREMOTES!" },
    { author: "Sarah T.", city: "Sydney, NSW", rating: 5, text: "Great quality products at competitive prices. The customer support team was very helpful in finding the right remote for my car." },
    { author: "David K.", city: "Brisbane, QLD", rating: 5, text: "Quick shipping and the product was exactly as described. Easy to program and works great. Will definitely shop here again!" },
    { author: "Lisa R.", city: "Perth, WA", rating: 5, text: "Best place to buy remotes online! Wide selection, genuine products, and excellent customer service. 5 stars!" },
    { author: "Mark P.", city: "Adelaide, SA", rating: 5, text: "Professional service and high-quality remotes. The warranty gives me confidence in my purchase. Thank you!" },
    { author: "Emma W.", city: "Hobart, TAS", rating: 5, text: "Fast delivery, great prices, and the remote works perfectly. The free shipping is a huge bonus. Highly satisfied!" },
    { author: "Chris B.", city: "Canberra, ACT", rating: 5, text: "Fast dispatch and clear compatibility notes. The remote paired in minutes." },
    { author: "Tony G.", city: "Darwin, NT", rating: 5, text: "Exactly what we needed for workshop reorders. Product quality is consistent." },
    { author: "Natalie F.", city: "Geelong, VIC", rating: 5, text: "Good pricing and support replied quickly with programming guidance." },
  ];

  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "ALLREMOTES Replacement Remotes",
    description: "Replacement garage door remotes, gate remotes and access control products.",
    brand: { "@type": "Brand", name: "ALLREMOTES" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: "5", worstRating: "1" },
      reviewBody: r.text,
      datePublished: new Date().toISOString().slice(0, 10),
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema).replace(/</g, "\\u003C") }}
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
