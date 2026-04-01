"use client";

import React from "react";

const TOP_BAR_ICONS = {
  WARRANTY: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  RETURNS: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  SAFE: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  SECURE: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  TRADE: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  SHIPPING: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  PRICING: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  MINIMUM: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
};

const STATIC_TOP_BAR_ITEMS = [
  "12 MONTHS WARRANTY",
  "30 DAY RETURNS",
  "SAFE & SECURE",
  "TRADE PRICING",
  "NO MINIMUM ORDER",
  "FREE SHIPPING",
];

const REQUIRED_TOP_BAR_ITEMS = ["NO MINIMUM ORDER", "FREE SHIPPING"];

const getIconForText = (text) => {
  const upper = (text || "").toUpperCase();
  for (const [keyword, icon] of Object.entries(TOP_BAR_ICONS)) {
    if (upper.includes(keyword)) return icon;
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

const mergeTopBarItems = (items) => {
  const merged = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const normalized = typeof item === "string" ? item.trim() : "";
    if (!normalized) continue;
    const key = normalized.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
  }

  for (const requiredItem of REQUIRED_TOP_BAR_ITEMS) {
    const key = requiredItem.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(requiredItem);
  }

  return merged;
};

const TopInfoBar = ({ promotions, collapsed = false }) => {
  const configuredItems =
    promotions?.topInfoBar?.enabled &&
    Array.isArray(promotions?.topInfoBar?.items) &&
    promotions.topInfoBar.items.length > 0
      ? promotions.topInfoBar.items
      : null;
  const items = mergeTopBarItems(configuredItems || STATIC_TOP_BAR_ITEMS);

  return (
    <div
      className={`overflow-hidden bg-accent-dark transition-all duration-500 ease-in-out ${
        collapsed
          ? "max-h-0 border-b border-transparent opacity-0"
          : "max-h-32 border-b border-accent-dark/50 opacity-100"
      }`}
      aria-hidden={collapsed}
    >
      <div className="container">
        <div className="grid w-full grid-cols-3 items-center gap-x-2 gap-y-1.5 px-2 py-[clamp(0.35rem,1.35vw,0.55rem)] text-[9px] font-semibold uppercase leading-snug tracking-[0.04em] text-white/90 min-[390px]:text-[10px] sm:gap-x-4 sm:gap-y-1.5 sm:px-0 sm:py-2 sm:text-[11px] sm:tracking-wide lg:grid-cols-6">
          {items.map((text, idx) => (
            <span
              key={`${idx}-${text}`}
              className="inline-flex min-w-0 items-center justify-center gap-1 whitespace-normal py-px text-center sm:w-full sm:gap-1.5 sm:whitespace-nowrap sm:py-0"
            >
              <span className="shrink-0 text-accent-light [&_svg]:h-3 [&_svg]:w-3 min-[390px]:[&_svg]:h-3.5 min-[390px]:[&_svg]:w-3.5">
                {getIconForText(text)}
              </span>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopInfoBar;
