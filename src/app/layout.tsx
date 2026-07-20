import type { Metadata, Viewport } from "next";
import { getMetadataBase, getSiteUrl } from "@/lib/site-url";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title:
    "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
  description:
    "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
  keywords: [
    "garage door remote",
    "gate remote",
    "remote control",
    "replacement remote",
    "garage motor remote",
    "remote accessories",
    "Australia",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    title:
      "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
    description:
      "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
    url: "/",
    images: [{ url: "/images/3.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
    description:
      "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
    images: [{ url: "/images/3.jpg" }],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
  },
};

const SITE_URL = getSiteUrl();
const SITE_NAME = "ALLREMOTES Australia";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products/all?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
];

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(26,122,110,0.06),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.05),transparent_26%),linear-gradient(180deg,#f7fcfa_0%,#fbf8f5_46%,#e7f3ef_100%)] antialiased">
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003C'),
          }}
        />
      </body>
    </html>
  );
}
