import React from "react";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

export type LocationPage = {
  slug: string;
  city: string;
  title: string;
  h1: string;
  metaDescription: string;
  keywords: string[];
  intro: string;
};

export const LOCATION_PAGES: Record<string, LocationPage> = {
  "garage-remotes-melbourne": {
    slug: "garage-remotes-melbourne",
    city: "Melbourne",
    title: "Garage Door Remotes Melbourne | Fast Delivery | ALLREMOTES",
    h1: "Garage Door Remotes Melbourne",
    metaDescription:
      "Buy replacement garage door remotes in Melbourne. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast delivery across Melbourne metro and VIC. 12-month warranty.",
    keywords: [
      "garage door remotes melbourne",
      "garage remote melbourne",
      "garage remote replacement melbourne",
      "buy garage remote melbourne",
      "garage door remote control melbourne",
    ],
    intro:
      "Looking for replacement garage door remotes in Melbourne? ALLREMOTES is based in Yarra Glen, Victoria, and we ship to all Melbourne metro suburbs and regional VIC with fast dispatch. Order your compatible replacement remote online and get it delivered to your door anywhere in Melbourne.",
  },
  "garage-remotes-sydney": {
    slug: "garage-remotes-sydney",
    city: "Sydney",
    title: "Garage Door Remotes Sydney | Replacement Remotes | ALLREMOTES",
    h1: "Garage Door Remotes Sydney",
    metaDescription:
      "Buy replacement garage door remotes in Sydney. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast delivery across Sydney metro and NSW. 12-month warranty.",
    keywords: [
      "garage door remotes sydney",
      "garage remote sydney",
      "garage remote replacement sydney",
      "buy garage remote sydney",
      "garage door remote control sydney",
    ],
    intro:
      "Need a replacement garage door remote in Sydney? ALLREMOTES ships to all Sydney metro suburbs and regional NSW with fast, tracked delivery. Browse our range of compatible remotes for Merlin, ATA, B&D, Chamberlain, Gliderol and more — all backed by a 12-month warranty.",
  },
  "garage-remotes-brisbane": {
    slug: "garage-remotes-brisbane",
    city: "Brisbane",
    title: "Garage Door Remotes Brisbane | Replacement Remotes | ALLREMOTES",
    h1: "Garage Door Remotes Brisbane",
    metaDescription:
      "Buy replacement garage door remotes in Brisbane. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast delivery across Brisbane metro and QLD. 12-month warranty.",
    keywords: [
      "garage door remotes brisbane",
      "garage remote brisbane",
      "garage remote replacement brisbane",
      "buy garage remote brisbane",
    ],
    intro:
      "Looking for garage door remotes in Brisbane? ALLREMOTES delivers to all Brisbane metro suburbs and regional Queensland. Order compatible replacement remotes for Merlin, ATA, B&D, Chamberlain and more with fast dispatch and a 12-month warranty.",
  },
  "gate-remotes-perth": {
    slug: "gate-remotes-perth",
    city: "Perth",
    title: "Gate Remotes Perth | Replacement Gate Remote Controls | ALLREMOTES",
    h1: "Gate Remotes Perth",
    metaDescription:
      "Buy replacement gate remotes in Perth. Compatible remotes for automatic swing gates, sliding gates & barrier arms. Fast delivery across Perth metro and WA. 12-month warranty.",
    keywords: [
      "gate remotes perth",
      "gate remote perth",
      "gate remote replacement perth",
      "automatic gate remote perth",
    ],
    intro:
      "Need a replacement gate remote in Perth? ALLREMOTES ships to all Perth metro suburbs and regional WA with fast, tracked delivery. Browse our range of compatible gate remotes for swing gates, sliding gates, and barrier arm openers — all backed by a 12-month warranty.",
  },
  "gate-remotes-adelaide": {
    slug: "gate-remotes-adelaide",
    city: "Adelaide",
    title: "Gate Remotes Adelaide | Replacement Gate Remote Controls | ALLREMOTES",
    h1: "Gate Remotes Adelaide",
    metaDescription:
      "Buy replacement gate remotes in Adelaide. Compatible remotes for automatic swing gates, sliding gates & barrier arms. Fast delivery across Adelaide metro and SA. 12-month warranty.",
    keywords: [
      "gate remotes adelaide",
      "gate remote adelaide",
      "gate remote replacement adelaide",
      "automatic gate remote adelaide",
    ],
    intro:
      "Looking for gate remotes in Adelaide? ALLREMOTES delivers to all Adelaide metro suburbs and regional South Australia. Order compatible replacement gate remotes for swing gates, sliding gates, and barrier arm openers with fast dispatch and a 12-month warranty.",
  },
  "garage-remotes-perth": {
    slug: "garage-remotes-perth",
    city: "Perth",
    title: "Garage Door Remotes Perth | Replacement Remotes | ALLREMOTES",
    h1: "Garage Door Remotes Perth",
    metaDescription:
      "Buy replacement garage door remotes in Perth. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast delivery across Perth metro and WA. 12-month warranty.",
    keywords: [
      "garage door remotes perth",
      "garage remote perth",
      "garage remote replacement perth",
      "buy garage remote perth",
    ],
    intro:
      "Need a replacement garage door remote in Perth? ALLREMOTES ships to all Perth metro suburbs and regional WA with fast, tracked delivery. Browse our range of compatible remotes for Merlin, ATA, B&D, Chamberlain, Gliderol and more — all backed by a 12-month warranty.",
  },
  "garage-remotes-adelaide": {
    slug: "garage-remotes-adelaide",
    city: "Adelaide",
    title: "Garage Door Remotes Adelaide | Replacement Remotes | ALLREMOTES",
    h1: "Garage Door Remotes Adelaide",
    metaDescription:
      "Buy replacement garage door remotes in Adelaide. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast delivery across Adelaide metro and SA. 12-month warranty.",
    keywords: [
      "garage door remotes adelaide",
      "garage remote adelaide",
      "garage remote replacement adelaide",
      "buy garage remote adelaide",
    ],
    intro:
      "Looking for garage door remotes in Adelaide? ALLREMOTES delivers to all Adelaide metro suburbs and regional South Australia. Order compatible replacement remotes for Merlin, ATA, B&D, Chamberlain and more with fast dispatch and a 12-month warranty.",
  },
  "garage-remotes-hobart": {
    slug: "garage-remotes-hobart",
    city: "Hobart",
    title: "Garage Door Remotes Hobart | Replacement Remotes | ALLREMOTES",
    h1: "Garage Door Remotes Hobart",
    metaDescription:
      "Buy replacement garage door remotes in Hobart. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast delivery across Hobart and TAS. 12-month warranty.",
    keywords: [
      "garage door remotes hobart",
      "garage remote hobart",
      "garage remote replacement hobart",
      "buy garage remote hobart",
    ],
    intro:
      "Need a replacement garage door remote in Hobart? ALLREMOTES ships to Hobart and regional Tasmania with fast, tracked delivery. Browse our range of compatible remotes for Merlin, ATA, B&D, Chamberlain, Gliderol and more — all backed by a 12-month warranty.",
  },
  "garage-remotes-darwin": {
    slug: "garage-remotes-darwin",
    city: "Darwin",
    title: "Garage Door Remotes Darwin | Replacement Remotes | ALLREMOTES",
    h1: "Garage Door Remotes Darwin",
    metaDescription:
      "Buy replacement garage door remotes in Darwin. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast delivery across Darwin and NT. 12-month warranty.",
    keywords: [
      "garage door remotes darwin",
      "garage remote darwin",
      "garage remote replacement darwin",
      "buy garage remote darwin",
    ],
    intro:
      "Looking for garage door remotes in Darwin? ALLREMOTES delivers to Darwin and the Northern Territory with fast, tracked delivery. Order compatible replacement remotes for Merlin, ATA, B&D, Chamberlain and more with a 12-month warranty.",
  },
  "garage-remotes-canberra": {
    slug: "garage-remotes-canberra",
    city: "Canberra",
    title: "Garage Door Remotes Canberra | Replacement Remotes | ALLREMOTES",
    h1: "Garage Door Remotes Canberra",
    metaDescription:
      "Buy replacement garage door remotes in Canberra. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. Fast delivery across Canberra and ACT. 12-month warranty.",
    keywords: [
      "garage door remotes canberra",
      "garage remote canberra",
      "garage remote replacement canberra",
      "buy garage remote canberra",
    ],
    intro:
      "Need a replacement garage door remote in Canberra? ALLREMOTES ships to Canberra and the ACT with fast, tracked delivery. Browse our range of compatible remotes for Merlin, ATA, B&D, Chamberlain, Gliderol and more — all backed by a 12-month warranty.",
  },
  "gate-remotes-melbourne": {
    slug: "gate-remotes-melbourne",
    city: "Melbourne",
    title: "Gate Remotes Melbourne | Replacement Gate Remote Controls | ALLREMOTES",
    h1: "Gate Remotes Melbourne",
    metaDescription:
      "Buy replacement gate remotes in Melbourne. Compatible remotes for automatic swing gates, sliding gates & barrier arms. Fast delivery across Melbourne metro and VIC. 12-month warranty.",
    keywords: [
      "gate remotes melbourne",
      "gate remote melbourne",
      "gate remote replacement melbourne",
      "automatic gate remote melbourne",
    ],
    intro:
      "Looking for gate remotes in Melbourne? ALLREMOTES is based in Yarra Glen, Victoria, and we ship to all Melbourne metro suburbs and regional VIC. Order compatible replacement gate remotes for swing gates, sliding gates, and barrier arm openers with fast dispatch and a 12-month warranty.",
  },
  "gate-remotes-sydney": {
    slug: "gate-remotes-sydney",
    city: "Sydney",
    title: "Gate Remotes Sydney | Replacement Gate Remote Controls | ALLREMOTES",
    h1: "Gate Remotes Sydney",
    metaDescription:
      "Buy replacement gate remotes in Sydney. Compatible remotes for automatic swing gates, sliding gates & barrier arms. Fast delivery across Sydney metro and NSW. 12-month warranty.",
    keywords: [
      "gate remotes sydney",
      "gate remote sydney",
      "gate remote replacement sydney",
      "automatic gate remote sydney",
    ],
    intro:
      "Need a replacement gate remote in Sydney? ALLREMOTES ships to all Sydney metro suburbs and regional NSW with fast, tracked delivery. Browse our range of compatible gate remotes for swing gates, sliding gates, and barrier arm openers — all backed by a 12-month warranty.",
  },
};

export function buildLocationJsonLd(page: LocationPage) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${page.slug}`;

  return [
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
}
