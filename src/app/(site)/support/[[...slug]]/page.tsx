import React from "react";
import type { Metadata } from "next";
import CategoryPageClient from "../../_components/CategoryPageClient";
import { getSiteUrl } from "@/lib/site-url";

type FAQ = { question: string; answer: string };

type SupportArticle = {
  title: string;
  description: string;
  keywords: string[];
  Component: () => React.ReactNode;
  faqs?: FAQ[];
};

function WhichRemoteArticle() {
  const faqs: FAQ[] = [
    {
      question: "How do I know which garage door remote I need?",
      answer:
        "Check the motor unit for the brand and model number, then match the remote to that model. If unsure, contact ALLREMOTES support.",
    },
    {
      question: "Can I use a universal remote for any garage door?",
      answer:
        "Some universal remotes work across many brands, but compatibility depends on frequency and rolling-code technology.",
    },
  ];
  return (
    <SupportArticleLayout title="Which Garage Door Remote Do I Need?" faqs={faqs}>
      <p className="mb-4 text-neutral-700">
        Choosing the right garage door remote starts with the motor brand and model. Most remotes are matched to specific opener series, so the sticker on your motor unit is the best place to begin.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">What to check on your motor</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li>Brand name: Merlin, ATA, B&D, Chamberlain or Gliderol.</li>
        <li>Model number and manufacture year.</li>
        <li>Colour and number of buttons on your current remote.</li>
        <li>Frequency label (often 433 MHz or 2.4 GHz).</li>
      </ul>
      <p className="mb-4 text-neutral-700">
        Once you have those details, browse the matching brand page or use the search bar on our all-products page. If you are still unsure, email us a photo of your motor and existing remote for confirmation.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Australian compatibility</h2>
      <p className="mb-4 text-neutral-700">
        We stock remotes and receivers tested for Australian frequencies and safety standards, so you get a reliable replacement without programming headaches.
      </p>
    </SupportArticleLayout>
  );
}

function MerlinTroubleshootingArticle() {
  const faqs: FAQ[] = [
    {
      question: "Why won't my Merlin remote program?",
      answer:
        "Most issues are caused by a flat battery, being out of range, or incorrect programming steps. Replace the battery and follow the motor manual's learn-button procedure.",
    },
    {
      question: "Do Merlin remotes need a specific battery?",
      answer:
        "Yes, typically a CR2032 coin cell. Always check the battery markings inside the remote casing.",
    },
  ];
  return (
    <SupportArticleLayout title="Merlin Remote Won't Program?" faqs={faqs}>
      <p className="mb-4 text-neutral-700">
        A Merlin remote that refuses to program is usually a quick fix. Before assuming a faulty remote, work through the checklist below.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Quick troubleshooting steps</h2>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-neutral-700">
        <li>Replace the remote battery with a fresh CR2032.</li>
        <li>Stand within one metre of the motor when programming.</li>
        <li>Press and release the learn button, then press the remote button within the timeout window.</li>
        <li>Clear old remotes from the motor if memory is full.</li>
        <li>Check for antenna damage or interference.</li>
      </ol>
      <p className="mb-4 text-neutral-700">
        If the motor beeps but the door does not respond, the remote may be a compatible but incorrect frequency. Match the part number on your original remote or motor label to the replacement listing.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">When to replace the remote</h2>
      <p className="mb-4 text-neutral-700">
        Cracked cases, worn buttons, or water damage can prevent reliable operation. A new remote is often cheaper than repeated call-out fees.
      </p>
    </SupportArticleLayout>
  );
}

function AtaVsMerlinArticle() {
  return (
    <SupportArticleLayout title="ATA vs Merlin Remote: Which Is Right for You?">
      <p className="mb-4 text-neutral-700">
        ATA and Merlin are two of the biggest garage door brands in Australia. The right remote depends on your motor, not your preference, because each brand uses different rolling-code technology.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">ATA remotes</h2>
      <p className="mb-4 text-neutral-700">
        ATA remotes are popular in domestic sectional and roller-door motors. They are generally identified by the SecuraCode range and are programmed through the motor's learn button.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Merlin remotes</h2>
      <p className="mb-4 text-neutral-700">
        Merlin remotes cover the Chamberlain and Merlin+ product lines. Look for the part number on the back of your existing remote (e.g., E960M, E945M) and match it exactly.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Cross-brand compatibility</h2>
      <p className="mb-4 text-neutral-700">
        Some aftermarket remotes work on multiple brands, but using an exact-match replacement is the safest way to keep your warranty and guarantee range.
      </p>
    </SupportArticleLayout>
  );
}

function LostGateRemoteArticle() {
  const faqs: FAQ[] = [
    {
      question: "Can I replace a lost gate remote without the original?",
      answer:
        "Yes. The motor brand and model number are enough for us to identify a compatible replacement.",
    },
    {
      question: "Should I erase the lost remote from the motor?",
      answer:
        "Yes. Erasing lost remotes from the motor memory prevents the missing remote from opening your gate.",
    },
  ];
  return (
    <SupportArticleLayout title="How to Replace a Lost Gate Remote" faqs={faqs}>
      <p className="mb-4 text-neutral-700">
        Losing a gate remote is frustrating, but replacing it is straightforward once you identify your motor system.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step-by-step replacement</h2>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-neutral-700">
        <li>Locate the motor box and note the brand and model.</li>
        <li>Count the buttons you need (one per gate or pedestrian access).</li>
        <li>Order a compatible remote from our brand pages.</li>
        <li>Program the new remote using the motor's learn button.</li>
        <li>Erase the lost remote from memory for security.</li>
      </ol>
      <p className="mb-4 text-neutral-700">
        For gated communities or commercial systems, check with the installer before clearing all stored remotes, as this may affect other users.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Security tip</h2>
      <p className="mb-4 text-neutral-700">
        If the remote is missing and not just broken, clear the motor memory and reprogram every remaining remote. This ensures the lost remote cannot be used by anyone else.
      </p>
    </SupportArticleLayout>
  );
}

const SUPPORT_ARTICLES: Record<string, SupportArticle> = {
  "which-garage-door-remote-do-i-need": {
    title: "Which Garage Door Remote Do I Need? | ALLREMOTES Australia",
    description:
      "Find out which garage door remote you need. Match your motor brand and model to a compatible replacement from ALLREMOTES Australia.",
    keywords: [
      "garage door remote",
      "which remote do i need",
      "garage door opener remote",
      "Merlin remote",
      "ATA remote",
    ],
    Component: WhichRemoteArticle,
  },
  "merlin-remote-wont-program": {
    title: "Merlin Remote Won't Program? Troubleshooting Guide | ALLREMOTES",
    description:
      "Troubleshoot a Merlin garage remote that won't program. Battery, learn button and range fixes from ALLREMOTES Australia.",
    keywords: [
      "Merlin remote wont program",
      "Merlin remote not working",
      "program Merlin remote",
      "garage door remote troubleshooting",
    ],
    Component: MerlinTroubleshootingArticle,
  },
  "ata-vs-merlin-remote": {
    title: "ATA vs Merlin Remote: Which Is Right for You? | ALLREMOTES",
    description:
      "Compare ATA and Merlin garage door remotes. Learn which replacement remote fits your motor at ALLREMOTES Australia.",
    keywords: [
      "ATA vs Merlin",
      "ATA remote",
      "Merlin remote",
      "garage door remote comparison",
    ],
    Component: AtaVsMerlinArticle,
  },
  "replace-lost-gate-remote": {
    title: "How to Replace a Lost Gate Remote | ALLREMOTES Australia",
    description:
      "Replace a lost gate remote quickly. Identify your motor brand, order a compatible remote and secure your gate with ALLREMOTES.",
    keywords: [
      "lost gate remote",
      "replace gate remote",
      "gate remote replacement",
      "garage gate remote lost",
    ],
    Component: LostGateRemoteArticle,
  },
};

function BreadcrumbJsonLd({ slug }: { slug: string }) {
  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/support/${slug}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Support",
          item: `${siteUrl}/support`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: SUPPORT_ARTICLES[slug]?.title.split(" | ")[0] || "Article",
          item: articleUrl,
        },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}

function FaqJsonLd({ faqs }: { faqs: FAQ[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function SupportArticleLayout({
  title,
  children,
  faqs,
}: {
  title: string;
  children: React.ReactNode;
  faqs?: FAQ[];
}) {
  return (
    <article className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-16">
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            {title}
          </h1>
        </header>
        <div className="prose prose-neutral max-w-none">{children}</div>
        {faqs && faqs.length > 0 && (
          <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">
              Frequently asked questions
            </h2>
            <dl className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx}>
                  <dt className="font-semibold text-neutral-900">
                    {faq.question}
                  </dt>
                  <dd className="mt-1 text-neutral-700">{faq.answer}</dd>
                </div>
              ))}
            </dl>
            <FaqJsonLd faqs={faqs} />
          </section>
        )}
      </div>
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = slug?.[0] || "";
  const article = key ? SUPPORT_ARTICLES[key] : null;
  if (article) {
    const canonical = `/support/${key}`;
    return {
      title: article.title,
      description: article.description,
      keywords: article.keywords,
      alternates: { canonical },
      openGraph: {
        title: article.title,
        description: article.description,
        type: "article",
        locale: "en_AU",
        siteName: "ALLREMOTES Australia",
        url: canonical,
        images: [{ url: "/images/3.jpg" }],
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description: article.description,
        images: [{ url: "/images/3.jpg" }],
      },
    };
  }
  return {
    title: "Support | ALLREMOTES Australia",
    description:
      "Get help with garage door, gate, car and home remotes at ALLREMOTES Australia.",
    keywords: ["remote support", "garage door remote help", "remote programming"],
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const key = slug?.[0] || "";
  const article = key ? SUPPORT_ARTICLES[key] : null;

  if (article) {
    const ArticleComponent = article.Component;
    return (
      <>
        <ArticleComponent />
        <BreadcrumbJsonLd slug={key} />
      </>
    );
  }

  return <CategoryPageClient category="support" />;
}

