import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import VerifyEmailClient from "./VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify Email | ALLREMOTES Australia",
  description:
    "Verify your ALLREMOTES Australia email address to activate your account and start shopping garage, gate and car remotes.",
  alternates: { canonical: "/verify-email" },
  openGraph: {
    title: "Verify Email | ALLREMOTES Australia",
    description:
      "Verify your ALLREMOTES Australia email address to activate your account and start shopping garage, gate and car remotes.",
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    url: "/verify-email",
    images: [{ url: "/images/3.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verify Email | ALLREMOTES Australia",
    description:
      "Verify your ALLREMOTES Australia email address to activate your account and start shopping garage, gate and car remotes.",
    images: [{ url: "/images/3.jpg" }],
  },
};

function VerifyEmailJsonLd() {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/verify-email`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Verify Email",
      url: pageUrl,
      description:
        "Verify your ALLREMOTES Australia email address to activate your account and start shopping garage, gate and car remotes.",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Verify Email", item: pageUrl },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemas).replace(/</g, "\\u003C"),
      }}
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <VerifyEmailClient />
      <VerifyEmailJsonLd />
    </>
  );
}
