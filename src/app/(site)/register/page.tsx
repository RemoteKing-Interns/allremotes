import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import RegisterWithProvider from "./RegisterForm";

export const metadata: Metadata = {
  title: "Register | ALLREMOTES Australia",
  description:
    "Create a free ALLREMOTES Australia account to save order details, checkout faster and manage garage, gate and car remote purchases.",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Register | ALLREMOTES Australia",
    description:
      "Create a free ALLREMOTES Australia account to save order details, checkout faster and manage garage, gate and car remote purchases.",
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    url: "/register",
    images: [{ url: "/images/3.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Register | ALLREMOTES Australia",
    description:
      "Create a free ALLREMOTES Australia account to save order details, checkout faster and manage garage, gate and car remote purchases.",
    images: [{ url: "/images/3.jpg" }],
  },
};

function RegisterJsonLd() {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/register`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Register",
      url: pageUrl,
      description:
        "Create a free ALLREMOTES Australia account to save order details, checkout faster and manage garage, gate and car remote purchases.",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Register", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I create an ALLREMOTES account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Fill in your name, email and a secure password, or register quickly with Google or Apple.",
          },
        },
        {
          "@type": "Question",
          name: "Why create an ALLREMOTES account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Save your details, track orders, speed through checkout and view your purchase history for remotes and accessories.",
          },
        },
        {
          "@type": "Question",
          name: "What if my email is already registered?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Go to the login page and sign in, or use the Forgot password link if you have forgotten your password.",
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

function RegisterFaq() {
  return (
    <section className="mx-auto w-full max-w-container-wide px-container py-10 sm:py-14">
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        Frequently asked questions
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900">
            How do I create an ALLREMOTES account?
          </h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Enter your name, email and a secure password, or sign up quickly with Google or Apple.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900">
            Why create an account?
          </h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Save your details, track orders, speed through checkout and view your purchase history.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900">
            Already registered?
          </h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Go to the login page, or use Forgot password if you cannot remember your password.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <>
      <RegisterWithProvider />
      <RegisterFaq />
      <RegisterJsonLd />
    </>
  );
}
