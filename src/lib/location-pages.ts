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
  /** Realistic standard-delivery estimate from our Yarra Glen VIC warehouse (looked up per city). */
  deliveryDays?: string;
  /** Genuinely city-specific copy so pages are not templated clones (looked up per slug). */
  localNote?: string;
};

// Per-slug delivery estimates and local content, joined into the page at
// render time. Keeping them here makes each page's unique copy easy to
// audit — every slug MUST have a distinct note.
const CITY_DELIVERY_DAYS: Record<string, string> = {
  Melbourne: "1-3 business days",
  Sydney: "3-5 business days",
  Brisbane: "4-6 business days",
  Perth: "5-8 business days",
  Adelaide: "2-4 business days",
  Hobart: "4-7 business days",
  Darwin: "6-9 business days",
  Canberra: "3-5 business days",
};

const LOCAL_NOTES: Record<string, string> = {
  "garage-remotes-melbourne":
    "Because our warehouse is in Yarra Glen, orders to Melbourne metro travel entirely within Victoria — most customers receive their remote within 1-2 business days, and often the next day after dispatch. B&D and Merlin openers are the most common doors we see across the eastern suburbs, while newer estates in areas like Craigieburn and Pakenham frequently use ATA remotes. If you're not sure which model you have, send us a photo of your existing remote or the opener unit and we'll identify it for you.",
  "garage-remotes-sydney":
    "Sydney orders travel interstate from our Victorian warehouse, so standard delivery typically lands within 3-5 business days — express shipping is worth it if you're locked out of your door. Merlin openers (including the Powerlift and Motorlift ranges) and ATA PTX remotes are the most common we ship to the North Shore, Hills District and Parramatta areas, with Gliderol roller doors common in older inner-city garages.",
  "garage-remotes-brisbane":
    "Queensland homes run a lot of B&D Controll-A-Door and roller door openers, especially in the Brisbane metro suburbs — if your remote has a single large button on a grey or red case, it's almost certainly a B&D. Standard delivery from our Victorian warehouse takes around 4-6 business days. The humid climate is hard on remote batteries, so if yours has stopped working, try a fresh CR2032 before replacing the whole remote.",
  "gate-remotes-perth":
    "Perth's long driveways and front-gate setups mean we ship a lot of gate remotes to WA — Elsema and ATA systems are common on acreage properties in the Swan Valley and outer suburbs, while B&D and Centurion appear on many smaller auto gates. Standard delivery to Perth takes 5-8 business days given the distance from our Victorian warehouse; if your gate remote is lost rather than broken, ordering two at once saves the wait next time.",
  "gate-remotes-adelaide":
    "Adelaide's foothills and Hills acreage blocks run plenty of Elsema and ATA gate systems, and standard delivery from Victoria is a quick 2-4 business days. Most Adelaide gate motors we match are on 433.92MHz — if your old remote's back says 433MHz and the brand isn't listed, send us a photo and we'll find a compatible replacement.",
  "garage-remotes-perth":
    "Perth is our longest mainland delivery run at 5-8 business days standard, so express shipping is popular for lockouts. B&D and Merlin openers dominate Perth garages, with Chamberlain LiftMaster units common in newer estates from Joondalup down to Mandurah. Every remote is tested before dispatch, so it arrives working — just add a battery and program it using the included instructions.",
  "garage-remotes-adelaide":
    "Adelaide orders arrive in 2-4 business days from our Victorian warehouse. ATA and Merlin openers are the most common doors we match for Adelaide customers, and Gliderol roller doors are widespread in older suburbs. If your opener is a Security+ 2.0 model (blue LED), make sure the replacement you order supports the same system — the product pages list compatibility clearly.",
  "garage-remotes-hobart":
    "Tasmania orders travel by air or sea freight from Victoria, typically arriving in 4-7 business days. Gliderol and B&D openers are common in Hobart garages, and Merlin Security+ remotes are frequent replacements for homes built in the 2000s. Cold mornings are hard on coin cells — if your remote is intermittent rather than dead, a fresh battery usually fixes it.",
  "garage-remotes-darwin":
    "Darwin and the NT are our longest delivery run at 6-9 business days, so we recommend ordering a spare remote at the same time — especially for rental properties and workshop gates. The tropical heat is brutal on remote batteries left in cars; keep your spare in a cool spot indoors and it will last far longer.",
  "garage-remotes-canberra":
    "Canberra orders arrive in 3-5 business days from Victoria. Newer estates in Gungahlin and Molonglo commonly run Merlin Security+ 2.0 and ATA PTX-6 openers, while older suburbs have plenty of B&D Controll-A-Door units. If your remote has tri-code or dip switches on the back, note that these older systems are also covered — check the compatibility list on each product page.",
  "gate-remotes-melbourne":
    "We're based in the Yarra Valley, so gate remotes to Melbourne metro and surrounds are effectively a local delivery — 1-2 business days, and often overnight. Rural and semi-rural properties around Melbourne's outskirts commonly run Elsema and ATA gate systems on 433MHz, while unit developments use many of the smaller Elsema and Gliderol handsets. Send us a photo of your remote's back if the brand has worn off — we identify these daily.",
  "gate-remotes-sydney":
    "Sydney gate remotes are dispatched from our Victorian warehouse in 3-5 business days standard. Sliding gate motors are common across Sydney's western and southern suburbs, with Elsema, ATA and Gliderol systems making up most of what we match. If your gate remote uses a rolling-code system (Security+ or otherwise), the product pages list exactly which motors each replacement works with.",
};

export function getLocationDeliveryDays(page: LocationPage): string {
  return CITY_DELIVERY_DAYS[page.city] || "2-6 business days";
}

export function getLocationLocalNote(page: LocationPage): string {
  return LOCAL_NOTES[page.slug] || "";
}

export const LOCATION_PAGES: Record<string, LocationPage> = {
  "garage-remotes-melbourne": {
    slug: "garage-remotes-melbourne",
    city: "Melbourne",
    title: "Garage Door Remotes Melbourne | Fast Local Delivery | ALLREMOTES",
    h1: "Garage Door Remotes Melbourne",
    metaDescription:
      "Buy replacement garage door remotes in Melbourne. Local Yarra Glen business with fast delivery across Melbourne metro & VIC. Compatible remotes for Merlin, ATA, B&D, Chamberlain & more. 12-month warranty.",
    keywords: [
      "garage door remotes melbourne",
      "garage remote melbourne",
      "garage remote replacement melbourne",
      "buy garage remote melbourne",
      "garage door remote control melbourne",
      "merlin remote melbourne",
      "b&d remote melbourne",
      "ata remote melbourne",
      "garage remotes victoria",
      "garage door remotes vic",
    ],
    intro:
      "Looking for replacement garage door remotes in Melbourne? ALLREMOTES is a locally owned business based in Yarra Glen, Victoria. We ship to all Melbourne metro suburbs — from the CBD to Frankston, Werribee, Craigieburn and beyond — plus regional VIC. Order your compatible replacement remote online and get it delivered to your door anywhere in Melbourne with fast, tracked shipping. All remotes come with a 12-month warranty and same-day dispatch for orders placed before 2pm AEST.",
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
