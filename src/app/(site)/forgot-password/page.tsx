import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import ForgotPasswordClient from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | ALLREMOTES Australia",
  description:
    "Reset your ALLREMOTES Australia password. Enter your email and we'll send a secure link to get back into your account.",
  alternates: { canonical: "/forgot-password" },
  openGraph: {
    title: "Forgot Password | ALLREMOTES Australia",
    description:
      "Reset your ALLREMOTES Australia password. Enter your email and we'll send a secure link to get back into your account.",
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    url: "/forgot-password",
    images: [{ url: "/images/3.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Forgot Password | ALLREMOTES Australia",
    description:
      "Reset your ALLREMOTES Australia password. Enter your email and we'll send a secure link to get back into your account.",
    images: [{ url: "/images/3.jpg" }],
  },
};

function ForgotPasswordJsonLd() {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/forgot-password`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Forgot Password",
      url: pageUrl,
      description:
        "Reset your ALLREMOTES Australia password. Enter your email and we'll send a secure link to get back into your account.",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Forgot Password", item: pageUrl },
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

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordClient />
      <ForgotPasswordJsonLd />
    </>
  );
}
