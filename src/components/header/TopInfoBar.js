"use client";

import React, { useState, useEffect } from "react";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const configuredItems =
    promotions?.topInfoBar?.enabled &&
    Array.isArray(promotions?.topInfoBar?.items) &&
    promotions.topInfoBar.items.length > 0
      ? promotions.topInfoBar.items
      : null;
  const items = mergeTopBarItems(configuredItems || STATIC_TOP_BAR_ITEMS);

  // Auto-rotate carousel on small screens
  useEffect(() => {
    if (items.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div
      className={`overflow-hidden bg-accent-dark transition-all duration-500 ease-in-out ${
        collapsed
          ? "max-h-0 border-b border-transparent opacity-0"
<<<<<<< Updated upstream
          : "max-h-32 border-b border-accent-dark/50 opacity-100"
=======
          : "max-h-24 border-b border-accent-dark opacity-100"
>>>>>>> Stashed changes
      }`}
      aria-hidden={collapsed}
    >
      <div className="container relative">
        <div className="w-full px-2 py-[clamp(0.25rem,1vw,0.4rem)] min-[390px]:px-0 sm:px-0 sm:py-[clamp(0.3rem,1.2vw,0.5rem)]">
          {/* Mobile/MD: Show one item at a time with carousel effect */}
          <div className="flex w-full items-center justify-center text-[9px] font-bold uppercase leading-snug tracking-[0.02em] text-white min-[390px]:text-[10px] max-[647px]:text-[8px] md:hidden">
            <div className="flex items-center justify-center gap-1 transition-all duration-500 ease-in-out min-[390px]:gap-1.5 max-[647px]:gap-0.5">
              <span className="shrink-0 text-white [&_svg]:h-3 [&_svg]:w-3 min-[390px]:[&_svg]:h-3.5 [&_svg]:w-3.5 max-[647px]:[&_svg]:h-2.5 [&_svg]:w-2.5">
                {getIconForText(items[currentIndex])}
              </span>
              <span className="text-center text-white font-extrabold max-[647px]:font-bold truncate px-1">{items[currentIndex]}</span>
            </div>
          </div>
          
          {/* Desktop: Show all items in grid */}
          <div className="hidden w-full items-center gap-x-2 text-[10px] font-semibold uppercase leading-snug tracking-[0.03em] text-white/90 md:grid md:grid-cols-6 lg:gap-x-3 lg:text-[11px] lg:tracking-[0.04em]">
            {items.map((text, idx) => (
              <span
                key={`${idx}-${text}`}
                className="inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap py-px text-center w-full"
              >
                <span className="shrink-0 text-white [&_svg]:h-3.5 [&_svg]:w-3.5">
                  {getIconForText(text)}
                </span>
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopInfoBar;
