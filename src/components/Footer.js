import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

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
  const content = <span className={styles.linkLabel}>{label}</span>;

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={styles.linkItem}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} className={styles.linkItem}>
      {content}
    </a>
  );
}

function FooterColumn({ title, items }) {
  return (
    <section className={styles.sectionCard}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      <ul className={styles.linkList}>
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
    <footer className={styles.shell}>
      <div className={styles.inner}>
        <div className={styles.layout}>
          <section className={styles.brandPanel}>
            <Link href="/" className={styles.logoLink} aria-label="ALLREMOTES home">
              <Image
                src="/images/mainlogo.png"
                alt="ALLREMOTES"
                width={3160}
                height={1247}
                sizes="(max-width: 768px) 210px, 240px"
                className={styles.logo}
              />
            </Link>

            <p className={styles.brandCopy}>
              Australia&apos;s trusted source for premium remote controls,
              automotive keys, and locksmithing tools. Quality guaranteed.
            </p>
          </section>

          <div className={styles.columns}>
            <FooterColumn title="Shop" items={categoriesItems} />
            <FooterColumn title="Support" items={supportItems} />
            <FooterColumn title="Company" items={policyItems} />
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.highlightRow}>
            {footerHighlights.map((item) => (
              <span key={item} className={styles.highlightPill}>
                {item}
              </span>
            ))}
          </div>

          <p className={styles.copyright}>
            &copy; {currentYear} ALLREMOTES. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
