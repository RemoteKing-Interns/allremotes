import React from "react";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

export type SeoLandingPage = {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  keywords: string[];
  intro: string;
  sections: Array<{ heading: string; body: React.ReactNode }>;
  faqs: Array<{ question: string; answer: string }>;
  ctaText: string;
  ctaLink: string;
};

export const SEO_LANDING_PAGES: Record<string, SeoLandingPage> = {
  "garage-door-remotes": {
    slug: "garage-door-remotes",
    title: "Garage Door Remotes Australia | Buy Replacement Remotes Online",
    h1: "Garage Door Remotes Australia",
    metaDescription:
      "Buy replacement garage door remotes online in Australia. Compatible remotes for Merlin, ATA, B&D, Chamberlain, Gliderol and more. 12-month warranty, fast shipping nationwide.",
    keywords: [
      "garage door remotes",
      "garage door remote",
      "garage door remote australia",
      "replacement garage door remote",
      "buy garage door remote",
      "garage remote control",
    ],
    intro:
      "Shop replacement garage door remotes for every major brand sold in Australia. ALLREMOTES stocks compatible remotes for Merlin, ATA, B&D, Chamberlain, Gliderol, Steel-Line and more — all backed by a 12-month warranty and shipped Australia-wide from our Yarra Glen warehouse.",
    sections: [
      {
        heading: "Replacement Garage Door Remotes for All Major Brands",
        body: (
          <>
            <p>
              When your garage door remote stops working, gets lost, or breaks, you need a replacement fast. At ALLREMOTES, we make it easy to find the exact compatible remote for your garage door motor. We stock replacements for the most popular garage door opener brands in Australia, including{" "}
              <Link href="/brands/Merlin" className="font-semibold text-primary hover:underline">Merlin</Link>,{" "}
              <Link href="/brands/ATA" className="font-semibold text-primary hover:underline">ATA</Link>,{" "}
              <Link href="/brands/B%26D" className="font-semibold text-primary hover:underline">B&amp;D</Link>,{" "}
              <Link href="/brands/Chamberlain" className="font-semibold text-primary hover:underline">Chamberlain</Link>,{" "}
              <Link href="/brands/Gliderol" className="font-semibold text-primary hover:underline">Gliderol</Link>{" "}
              and Steel-Line. Each remote is quality-tested and comes with programming instructions so you can pair it with your motor in minutes.
            </p>
          </>
        ),
      },
      {
        heading: "How to Identify Your Garage Door Remote",
        body: (
          <>
            <p>
              The easiest way to find the right replacement is to check your existing remote for a brand name and model number. This is usually printed on the back or inside the battery compartment. If you can&apos;t find it, check the motor unit mounted on your garage ceiling — the brand and model are typically on a label on the motor housing. You can also check our{" "}
              <Link href="/support/which-garage-door-remote-do-i-need" className="font-semibold text-primary hover:underline">
                remote identification guide
              </Link>{" "}
              for step-by-step help.
            </p>
          </>
        ),
      },
      {
        heading: "Programming Your Replacement Garage Door Remote",
        body: (
          <>
            <p>
              Most replacement garage door remotes can be programmed in under five minutes. The typical process involves pressing a learn button on your motor unit, then pressing a button on your new remote to pair them. We include programming instructions with every remote, and our{" "}
              <Link href="/support" className="font-semibold text-primary hover:underline">support guides</Link>{" "}
              cover detailed instructions for each brand. If you run into trouble, our team is available to help — just{" "}
              <Link href="/contact" className="font-semibold text-primary hover:underline">contact us</Link>.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Are these remotes compatible with my garage door motor?",
        answer:
          "Yes. All our remotes are compatible replacements for the specific motor brands and models listed on each product page. Check the compatibility list on the product page or use our remote identification guide if you're unsure.",
      },
      {
        question: "How long does shipping take?",
        answer:
          "Orders placed before 2pm AEST ship the same business day. Standard delivery takes 2-5 business days to most Australian addresses. Express shipping is available at checkout.",
      },
      {
        question: "Do the remotes come with a warranty?",
        answer:
          "Yes, all remotes come with a 12-month warranty. If your remote stops working within the warranty period, contact us for a replacement.",
      },
      {
        question: "Can I program the remote myself?",
        answer:
          "Yes, most remotes can be programmed in under five minutes. Each remote includes programming instructions, and our support guides have step-by-step videos for each brand.",
      },
    ],
    ctaText: "Shop All Garage Door Remotes",
    ctaLink: "/products/garage",
  },
  "gate-remotes": {
    slug: "gate-remotes",
    title: "Gate Remotes Australia | Buy Replacement Gate Remote Controls",
    h1: "Gate Remotes Australia",
    metaDescription:
      "Buy replacement gate remotes online in Australia. Compatible remotes for automatic swing gates, sliding gates and barrier arms. 12-month warranty, fast nationwide shipping.",
    keywords: [
      "gate remotes",
      "gate remote",
      "gate remote australia",
      "replacement gate remote",
      "automatic gate remote",
      "gate remote control",
      "sliding gate remote",
    ],
    intro:
      "Shop replacement gate remotes for automatic swing gates, sliding gates, and barrier arm openers. ALLREMOTES stocks compatible gate remote controls for Centurion, Elsema, and all major 433MHz gate motor brands — with fast Australia-wide shipping and a 12-month warranty.",
    sections: [
      {
        heading: "Replacement Gate Remotes for Every Application",
        body: (
          <>
            <p>
              Whether you have a residential swing gate, a commercial sliding gate, or an industrial barrier arm, we have a compatible replacement remote for your motor. Our gate remotes work with the most common gate opener brands in Australia, including Centurion, Elsema, and generic 433MHz receivers. All remotes are pre-tested and ship with programming instructions.
            </p>
          </>
        ),
      },
      {
        heading: "Sliding Gate Remotes",
        body: (
          <>
            <p>
              Sliding gate motors are common in commercial and residential settings across Australia. We stock compatible remotes for sliding gate openers that operate on 433MHz, including models compatible with Centurion sliding gate motors. If your sliding gate remote is lost or damaged, browse our range for a quick replacement.
            </p>
          </>
        ),
      },
      {
        heading: "How to Program a Gate Remote",
        body: (
          <>
            <p>
              Programming a replacement gate remote is typically a simple process. Most gate motors have a learn button on the control board — press it, then press a button on your new remote to pair them. Detailed instructions are included with every remote. For gate-specific help, check our{" "}
              <Link href="/support" className="font-semibold text-primary hover:underline">support guides</Link>{" "}
              or{" "}
              <Link href="/contact" className="font-semibold text-primary hover:underline">contact our team</Link>.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Will these gate remotes work with my gate motor?",
        answer:
          "Our gate remotes are compatible with the motor brands and models listed on each product page. Check the compatibility information before ordering, or contact us if you're unsure about your specific gate motor model.",
      },
      {
        question: "What frequency do gate remotes use?",
        answer:
          "Most gate remotes in Australia operate on 433MHz. Some older models may use 27MHz or 315MHz. Check your existing remote or motor unit for the frequency before ordering.",
      },
      {
        question: "Can I use one remote for both my gate and garage door?",
        answer:
          "Some multi-button remotes can be programmed to operate both a gate and a garage door, provided they use the same frequency and coding system. Check the product description for multi-channel options.",
      },
    ],
    ctaText: "Shop All Gate Remotes",
    ctaLink: "/products/garage",
  },
  "replacement-garage-remotes": {
    slug: "replacement-garage-remotes",
    title: "Replacement Garage Door Remotes Australia | ALLREMOTES",
    h1: "Replacement Garage Door Remotes",
    metaDescription:
      "Need a replacement garage door remote? Buy compatible replacement remotes for Merlin, ATA, B&D, Chamberlain, Gliderol and more. Fast shipping, 12-month warranty.",
    keywords: [
      "replacement garage door remote",
      "replacement garage remote",
      "garage door remote replacement",
      "spare garage remote",
      "garage remote replacement australia",
    ],
    intro:
      "Lost or broken your garage door remote? ALLREMOTES stocks replacement garage door remotes for every major Australian brand. Order online with fast shipping, 12-month warranty, and easy-to-follow programming instructions.",
    sections: [
      {
        heading: "Finding Your Replacement Remote",
        body: (
          <>
            <p>
              Replacing a lost or broken garage door remote is straightforward. Check the brand name on your existing remote or motor unit, then browse our{" "}
              <Link href="/shop-by-brand" className="font-semibold text-primary hover:underline">brand pages</Link>{" "}
              to find the matching model. We stock replacements for Merlin, ATA, B&amp;D, Chamberlain, Gliderol, Steel-Line, Centurion, and more. If you can&apos;t find your model, use our{" "}
              <Link href="/support/which-garage-door-remote-do-i-need" className="font-semibold text-primary hover:underline">
                remote identification guide
              </Link>{" "}
              or contact our team for help.
            </p>
          </>
        ),
      },
      {
        heading: "Why Buy a Replacement Remote from ALLREMOTES?",
        body: (
          <>
            <p>
              All our replacement remotes are quality-tested, come with a 12-month warranty, and include programming instructions. We ship Australia-wide with same-day dispatch for orders placed before 2pm AEST. Our 30-day return policy means you can shop with confidence.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "How do I know which replacement remote to buy?",
        answer:
          "Check your existing remote or motor unit for the brand name and model number, then browse our brand pages. If you're unsure, use our remote identification guide or contact us.",
      },
      {
        question: "Are replacement remotes as good as the original?",
        answer:
          "Yes. Our compatible replacement remotes are manufactured to the same specifications and use the same frequency and coding technology as the originals. They come with a 12-month warranty.",
      },
      {
        question: "How quickly can I get a replacement remote?",
        answer:
          "Orders placed before 2pm AEST ship the same business day. Standard delivery takes 2-5 business days to most Australian addresses.",
      },
    ],
    ctaText: "Browse All Replacement Remotes",
    ctaLink: "/products/all",
  },
};

export function buildLandingPageJsonLd(page: SeoLandingPage) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${page.slug}`;

  const schemas: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      url: pageUrl,
      description: page.metaDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: page.h1, item: pageUrl },
      ],
    },
  ];

  if (page.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  return schemas;
}
