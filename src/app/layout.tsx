import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getMetadataBase, getSiteUrl } from "@/lib/site-url";
import Providers from "./providers";
import DisableAutofill from "@/components/DisableAutofill";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title:
    "Garage Door Remotes & Gate Remotes Australia | ALLREMOTES",
  description:
    "Buy replacement garage door remotes, gate remotes and access control products online. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast shipping Australia-wide, 30-day returns, 12-month warranty.",
  keywords: [
    "garage door remote",
    "gate remote",
    "remote control",
    "replacement remote",
    "garage motor remote",
    "home automation remote",
    "TV remote",
    "air conditioner remote",
    "locksmithing tools",
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
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    title:
      "Garage Door Remotes & Gate Remotes Australia | ALLREMOTES",
    description:
      "Buy replacement garage door remotes, gate remotes and access control products online. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast shipping Australia-wide, 30-day returns, 12-month warranty.",
    url: "/",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "ALLREMOTES Australia - Garage Door Remotes & Gate Remotes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Garage Door Remotes & Gate Remotes Australia | ALLREMOTES",
    description:
      "Buy replacement garage door remotes, gate remotes and access control products online. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast shipping Australia-wide, 30-day returns, 12-month warranty.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "ALLREMOTES Australia - Garage Door Remotes & Gate Remotes",
      },
    ],
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
    apple: [
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  },
};

const SITE_URL = getSiteUrl();
const SITE_NAME = "ALLREMOTES Australia";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    image: `${SITE_URL}/images/og-image.png`,
    telephone: "+61 3 9999 9999",
    email: "shane@allremotes.com.au",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Yarra Glen",
      addressRegion: "VIC",
      postalCode: "3775",
      addressCountry: "AU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -37.6596,
      longitude: 145.3743,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    areaServed: "AU",
    priceRange: "$$",
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
    <html lang="en" data-scroll-behavior="smooth" className={plusJakartaSans.variable}>
      <head>
        <link rel="preconnect" href="https://s3.ap-southeast-2.amazonaws.com" />
        <link rel="dns-prefetch" href="https://s3.ap-southeast-2.amazonaws.com" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18410791303"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18410791303');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(26,122,110,0.06),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.05),transparent_26%),linear-gradient(180deg,#f7fcfa_0%,#fbf8f5_46%,#e7f3ef_100%)] antialiased">
        <Providers>{children}</Providers>
        <DisableAutofill />
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
