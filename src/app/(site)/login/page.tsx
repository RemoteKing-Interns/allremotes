import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import LoginWithProvider from "./LoginForm";

export const metadata: Metadata = {
  title: "Login | ALLREMOTES Australia",
  description:
    "Log in to your ALLREMOTES Australia account to track orders, manage saved addresses and shop garage, gate and car remotes faster.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Login | ALLREMOTES Australia",
    description:
      "Log in to your ALLREMOTES Australia account to track orders, manage saved addresses and shop garage, gate and car remotes faster.",
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    url: "/login",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | ALLREMOTES Australia",
    description:
      "Log in to your ALLREMOTES Australia account to track orders, manage saved addresses and shop garage, gate and car remotes faster.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
  },
};

function LoginJsonLd() {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/login`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Login",
      url: pageUrl,
      description:
        "Log in to your ALLREMOTES Australia account to track orders, manage saved addresses and shop garage, gate and car remotes faster.",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Login", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I log in to my ALLREMOTES account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your email and password on the login form, or sign in quickly with Google or Apple.",
          },
        },
        {
          "@type": "Question",
          name: "What can I do in my ALLREMOTES account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Track orders, save delivery addresses, view order history and checkout faster on garage, gate and car remotes.",
          },
        },
        {
          "@type": "Question",
          name: "What if I forgot my password?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Click the Forgot password link and we will email a secure password reset link.",
          },
        },
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

function LoginFaq() {
  return (
    <section className="mx-auto w-full max-w-container-wide px-container py-10 sm:py-14">
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        Frequently asked questions
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900">
            How do I log in to my ALLREMOTES account?
          </h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Enter your email and password, or sign in quickly with Google or Apple.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900">
            What can I do in my account?
          </h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Track orders, save addresses, view your order history and checkout faster on remotes and accessories.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900">
            What if I forgot my password?
          </h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Click the Forgot password link and we will email a secure reset link.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <>
      <LoginWithProvider />
      <LoginFaq />
      <LoginJsonLd />
    </>
  );
}
