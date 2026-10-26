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

// GA4 property measurement ID (format "G-XXXXXXXXXX"). Loaded alongside the
// Google Ads gtag; commerce events (purchase, add_to_cart, begin_checkout)
// fire into the shared dataLayer and are measured by both.
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "";

// Meta pixel ID — powers catalog event matching (ViewContent/AddToCart/Purchase)
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "2371411737020642";

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
        {GA4_MEASUREMENT_ID && (
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
        )}
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18410791303');
            ${GA4_MEASUREMENT_ID ? `gtag('config', '${GA4_MEASUREMENT_ID}');` : ""}
          `}
        </Script>
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
                document,'script','https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className="min-h-screen bg-[#f6f7f9] antialiased">
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
