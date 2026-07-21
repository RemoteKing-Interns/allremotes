"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "../context/StoreContext";

const policyItems = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/shipping-delivery", label: "Shipping & Delivery" },
  { href: "/return-policy", label: "Return Policy" },
  { href: "/payment-options", label: "Payment Options" },
];

const supportItems = [
  { href: "/support", label: "Support Center" },
  { href: "/contact", label: "Contact Us" },
  { href: "mailto:info@allremotes.com.au", label: "info@allremotes.com.au" },
];

function FooterItem({ href, label }) {
  const content = (
    <span className="min-w-0 text-sm leading-snug text-white/70 hover:text-white">
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
      <h4 className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-white/95">
        {title}
      </h4>
      <ul className="grid gap-2.5">
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
  const { getSettings } = useStore();
  const settings = getSettings();
  return (
    <footer className="relative mt-0 overflow-hidden text-white [background:radial-gradient(circle_at_6%_18%,rgba(10,71,67,0.48),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(126,32,43,0.42),transparent_34%),linear-gradient(100deg,#0d2020_0%,#272326_48%,#5d1f29_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_36%)]" />

      <div className="relative z-10 mx-auto w-full max-w-container-wide px-4 py-8 sm:py-10">
        <div className="grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <section className="grid min-w-0 content-start gap-3">
            <Link href="/" className="inline-flex w-fit max-w-full items-center" aria-label="ALLREMOTES home">
              <Image
                src="/images/mainlogo.png"
                alt="ALLREMOTES"
                width={3160}
                height={1247}
                sizes="(max-width: 768px) 120px, 140px"
                className="h-7 w-auto max-w-full brightness-0 invert"
              />
            </Link>
            <p className="max-w-[20rem] text-sm leading-6 text-white/70">
              Premium remote controls, automotive keys, and locksmithing tools.
            </p>
          </section>

          <FooterColumn title="Support" items={supportItems} />
          <FooterColumn title="Company" items={policyItems} />
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-5 text-xs text-white/60 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="font-semibold text-white/90">{settings.businessName}</span>
            <span>ABN: {settings.abn}</span>
            <span>{settings.businessAddress}</span>
            <span>{settings.gstStatement}</span>
            <a href="mailto:info@allremotes.com.au" className="underline hover:text-white">info@allremotes.com.au</a>
            <span>Australia-wide shipping only</span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {['mastercard', 'visa', 'eftpos', 'amex', 'jcb', 'apple-pay', 'google-pay'].map((icon) => (
              <img
                key={icon}
                src={`/icons/payments/${icon}.png`}
                alt={icon}
                className="h-8 w-auto rounded"
              />
            ))}
          </div>
        </div>

        <p className="mt-5 text-xs text-white/40">
          &copy; {currentYear} ALLREMOTES. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
