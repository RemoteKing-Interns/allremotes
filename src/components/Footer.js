import React from "react";
import Image from "next/image";
import Link from "next/link";

const categoriesItems = [
  { href: "/garage-gate", label: "Garage & Gate" },
  { href: "/automotive", label: "Automotive" },
  { href: "/for-the-home", label: "For The Home" },
  { href: "/locksmithing", label: "Locksmithing" },
  { href: "/shop-by-brand", label: "Shop By Brand" },
  { href: "/products/all", label: "All Products" },
];

const policyItems = [
  { href: "/support", label: "Privacy Policy" },
  { href: "/support", label: "Shipping & Delivery" },
  { href: "/support", label: "Returns & Warranty" },
  { href: "/support", label: "Safe & Secure Checkout" },
];

const supportItems = [
  { href: "/support", label: "Support Center" },
  { href: "/contact", label: "Contact Us" },
  { href: "mailto:support@allremotes.com", label: "support@allremotes.com" },
];

const footerHighlights = ["30 Day Returns", "Trade Support", "Secure Payments"];

function FooterItem({ href, label }) {
  const content = (
    <span className="min-w-0 text-[0.98rem] leading-snug text-white/70 hover:text-white">
      {label}
    </span>
  );

  if (href.startsWith("/")) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return (
    <a href={href} className="inline-flex items-center">
      {content}
    </a>
  );
}

function FooterColumn({ title, items }) {
  return (
    <section className="min-w-0">
      <h4 className="mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-white/95">
        {title}
      </h4>
      <ul className="grid gap-4">
        {items.map((item) => (
          <li key={`${title}-${item.label}`}>
            <FooterItem href={item.href} label={item.label} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-0 overflow-hidden text-white [background:radial-gradient(circle_at_6%_18%,rgba(10,71,67,0.48),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(126,32,43,0.42),transparent_34%),linear-gradient(100deg,#0d2020_0%,#272326_48%,#5d1f29_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_36%)]" />

      <div className="relative z-10 mx-auto w-full max-w-container-wide px-container py-12 sm:py-14">
        <div className="grid items-start gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2.85fr)] lg:gap-14">
          <section className="grid min-w-0 content-start justify-items-center gap-4 text-center lg:justify-items-start lg:text-left">
            <Link href="/" className="inline-flex w-fit max-w-full items-center" aria-label="ALLREMOTES home">
              <Image
                src="/images/mainlogo.png"
                alt="ALLREMOTES"
                width={3160}
                height={1247}
                sizes="(max-width: 768px) 210px, 240px"
                className="h-[3.1rem] w-auto max-w-full brightness-0 invert sm:h-[3.5rem]"
              />
            </Link>

            <p className="max-w-[22rem] text-[0.98rem] leading-7 text-white/80">
              Australia&apos;s trusted source for premium remote controls,
              automotive keys, and locksmithing tools. Quality guaranteed.
            </p>
          </section>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            <FooterColumn title="Shop" items={categoriesItems} />
            <FooterColumn title="Support" items={supportItems} />
            <FooterColumn title="Company" items={policyItems} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/15 pt-6 lg:mt-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {footerHighlights.map((item) => (
              <span
                key={item}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-4 text-[0.94rem] font-medium text-white/75 max-[480px]:w-full"
              >
                {item}
              </span>
            ))}
          </div>

          <p className="text-[0.96rem] text-white/45 lg:text-right">
            &copy; {currentYear} ALLREMOTES. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
