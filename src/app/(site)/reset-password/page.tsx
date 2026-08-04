import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import ResetPasswordClient from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | ALLREMOTES Australia",
  description:
    "Set a new password for your ALLREMOTES Australia account. Use the secure reset link sent to your email to regain access.",
  alternates: { canonical: "/reset-password" },
  openGraph: {
    title: "Reset Password | ALLREMOTES Australia",
    description:
      "Set a new password for your ALLREMOTES Australia account. Use the secure reset link sent to your email to regain access.",
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    url: "/reset-password",
    images: [{ url: "/images/3.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reset Password | ALLREMOTES Australia",
    description:
      "Set a new password for your ALLREMOTES Australia account. Use the secure reset link sent to your email to regain access.",
    images: [{ url: "/images/3.jpg" }],
  },
};

function ResetPasswordJsonLd() {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/reset-password`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Reset Password",
      url: pageUrl,
      description:
        "Set a new password for your ALLREMOTES Australia account. Use the secure reset link sent to your email to regain access.",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Reset Password", item: pageUrl },
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

export default function ResetPasswordPage() {
  return (
    <>
      <ResetPasswordClient />
      <ResetPasswordJsonLd />
    </>
  );
}
