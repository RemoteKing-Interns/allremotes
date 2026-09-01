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
    h1: "Gate Remotes & Gate Remote Controls Australia",
    metaDescription:
      "Buy replacement gate remotes online in Australia. Compatible remotes for automatic swing gates, sliding gates, barrier arms, DEA, Fadini, Nice, Centurion & more. 12-month warranty, fast shipping.",
    keywords: [
      "gate remotes",
      "gate remote",
      "gate remote control",
      "gate remote controls",
      "replacement gate remote",
      "automatic gate remote",
      "universal gate remote",
      "sliding gate remote",
      "boom gate remote",
      "gate transmitter",
      "gate remotes australia",
    ],
    intro:
      "Shop replacement gate remotes for automatic swing gates, sliding gates, and barrier arm openers. ALLREMOTES stocks compatible gate remote controls for Centurion, Elsema, DEA, Fadini, Nice, Ditec and all major 433MHz gate motor brands — with fast Australia-wide shipping and a 12-month warranty.",
    sections: [
      {
        heading: "Replacement Gate Remotes for Every Application",
        body: (
          <>
            <p>
              Whether you have a residential swing gate, a commercial sliding gate, or an industrial barrier arm, we have a compatible replacement remote for your motor. Our gate remotes work with the most common gate opener brands in Australia. All remotes are pre-tested and ship with programming instructions.
            </p>
          </>
        ),
      },
      {
        heading: "Gate Remote Brands We Support",
        body: (
          <>
            <p>
              We stock compatible replacement gate remotes for the following manufacturers:
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: "Centurion", desc: "Sliding & swing gate motors" },
                { name: "Elsema", desc: "433MHz gate receivers" },
                { name: "DEA", desc: "GTX, GTX2 transmitters" },
                { name: "Fadini", desc: "Italian gate motors" },
                { name: "Nice", desc: "Nice gate openers" },
                { name: "Ditec", desc: "Ditec gate motors" },
                { name: "Global Access", desc: "Gate access systems" },
                { name: "Key Automation", desc: "Automated gate systems" },
                { name: "Allgate", desc: "Universal gate remotes" },
              ].map((mfr) => (
                <div key={mfr.name} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <p className="font-semibold text-neutral-900 text-sm">{mfr.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">{mfr.desc}</p>
                </div>
              ))}
            </div>
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
        heading: "Universal Gate Remotes",
        body: (
          <>
            <p>
              Universal gate remotes can be programmed to work with multiple gate motor brands, provided they use the same frequency and coding system. They are a good option if you have multiple gates with different motor brands, or if you can&apos;t find a brand-specific replacement. However, universal remotes may not support rolling code technology on all motors — check the compatibility list before ordering.
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
      {
        question: "Do you stock Centurion gate remotes?",
        answer:
          "Yes, we stock compatible replacement remotes for Centurion sliding and swing gate motors. Check our Centurion brand page for the full range.",
      },
      {
        question: "Are universal gate remotes reliable?",
        answer:
          "Universal gate remotes work well with fixed-code gate motors on 433MHz. For rolling code motors, a brand-specific replacement is usually more reliable. Check the compatibility list on each product page.",
      },
    ],
    ctaText: "Shop All Gate Remotes",
    ctaLink: "/products/garage",
  },
  "roller-door-remotes": {
    slug: "roller-door-remotes",
    title: "Roller Door Remotes Australia | Replacement Roller Door Remote Controls",
    h1: "Roller Door Remotes Australia",
    metaDescription:
      "Buy replacement roller door remotes online in Australia. Compatible remotes for B&D, Merlin, ATA, Gliderol roller door openers. 12-month warranty, fast shipping nationwide.",
    keywords: [
      "roller door remotes",
      "roller door remote",
      "roller door remote control",
      "replacement roller door remote",
      "b&d roller door remote",
      "garage roller door remote",
      "roller door remote australia",
    ],
    intro:
      "Shop replacement roller door remotes for every major Australian roller door opener brand. ALLREMOTES stocks compatible remotes for B&D, Merlin, ATA and Gliderol roller door motors — all backed by a 12-month warranty and shipped Australia-wide.",
    sections: [
      {
        heading: "Replacement Roller Door Remotes for All Brands",
        body: (
          <>
            <p>
              Roller door openers use the same remote technology as sectional garage door openers, but the motor units are typically mounted differently. Whether you have a B&D Controll-A-Door roller, a Merlin roller door opener, or a Gliderol GTS roller, we have a compatible replacement remote. Browse our{" "}
              <Link href="/products/garage" className="font-semibold text-primary hover:underline">garage remotes range</Link>{" "}
              to find the right match for your motor.
            </p>
          </>
        ),
      },
      {
        heading: "Popular Roller Door Remote Brands",
        body: (
          <>
            <p>
              The most common roller door opener brands in Australia are{" "}
              <Link href="/brands/B%26D" className="font-semibold text-primary hover:underline">B&D</Link>,{" "}
              <Link href="/brands/Merlin" className="font-semibold text-primary hover:underline">Merlin</Link>,{" "}
              <Link href="/brands/ATA" className="font-semibold text-primary hover:underline">ATA</Link>{" "}
              and{" "}
              <Link href="/brands/Gliderol" className="font-semibold text-primary hover:underline">Gliderol</Link>. Most roller door remotes operate on 433MHz and use rolling code technology for security. Check your existing remote or motor unit for the brand and model before ordering.
            </p>
          </>
        ),
      },
      {
        heading: "How to Identify Your Roller Door Remote",
        body: (
          <>
            <p>
              Check the motor unit at the top of your roller door for a brand label and model number. Alternatively, check the back of your existing remote — the brand and model are usually printed there. If you can&apos;t find the details, use our{" "}
              <Link href="/support/which-garage-door-remote-do-i-need" className="font-semibold text-primary hover:underline">
                remote identification guide
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="font-semibold text-primary hover:underline">contact us</Link>{" "}
              with a photo of your remote.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Are roller door remotes the same as garage door remotes?",
        answer:
          "Yes, roller door openers use the same remote technology as sectional garage door openers. The key is matching the brand and frequency (usually 433MHz) to your motor unit.",
      },
      {
        question: "How do I program a roller door remote?",
        answer:
          "Most roller door remotes are programmed by pressing the learn button on the motor unit, then pressing a button on the new remote. Programming instructions are included with every remote.",
      },
      {
        question: "Do you stock B&D roller door remotes?",
        answer:
          "Yes, we stock compatible replacement remotes for B&D roller door openers including Controll-A-Door and Tri-Tran+ models. Check our B&D brand page for the full range.",
      },
    ],
    ctaText: "Shop All Garage & Roller Door Remotes",
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
