"use client";

import React, { useEffect, useRef, useState } from "react";
import { combineAddressUnit } from "../lib/utils";

export type AddressSuggestion = {
  formatted: string;
  addressLine1: string;
  housenumber: string;
  city: string;
  state: string;
  postcode: string;
};

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
const COUNTRY_FILTER = "au";

/**
 * Street-address input with Geoapify autocomplete (Australia).
 * Same lookup behavior as checkout: debounced suggestions, unit-number
 * preservation, keyboard navigation (up/down/enter/escape).
 *
 *   <AddressAutocomplete
 *     value={addr} onChange={setAddr}
 *     onSelect={(s) => setForm({ address: s.addressLine1, city: s.city, state: s.state, zip: s.postcode })}
 *   />
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  className = "",
  placeholder = "Street address",
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  className?: string;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const query = value.trim();

  useEffect(() => {
    if (!GEOAPIFY_KEY || !open || query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
        url.searchParams.set("text", query);
        url.searchParams.set("limit", "20");
        url.searchParams.set("format", "json");
        url.searchParams.set("lang", "en");
        url.searchParams.set("apiKey", GEOAPIFY_KEY);
        url.searchParams.set("filter", `countrycode:${COUNTRY_FILTER}`);
        url.searchParams.set("bias", "proximity:133.7751,-25.2744");

        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = await res.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        setSuggestions(
          results
            .map((r: any, idx: number) => {
              const house = r.housenumber ?? "";
              return {
                id: String(r.place_id ?? idx),
                formatted: combineAddressUnit(query, house, r.formatted ?? ""),
                addressLine1: combineAddressUnit(query, house, r.address_line1 ?? ""),
                housenumber: house,
                city: r.suburb || r.city || r.town || r.village || "",
                state: r.state_code || r.state || "",
                postcode: r.postcode ?? "",
              };
            })
            .filter((s: AddressSuggestion) => s.formatted || s.addressLine1)
        );
      } catch (err: any) {
        if (err?.name !== "AbortError") setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query, open]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = (s: AddressSuggestion) => {
    onSelect(s);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && query.length >= 3 && (loading || suggestions.length > 0) && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          {loading && suggestions.length === 0 && (
            <p className="px-3 py-2 text-xs text-neutral-400">Searching addresses…</p>
          )}
          {suggestions.map((s, i) => (
            <button
              key={`${s.formatted}-${i}`}
              type="button"
              // onMouseDown fires before the input blur/outside-click handler
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 ${i === activeIndex ? "bg-emerald-50" : ""}`}
            >
              {s.formatted || s.addressLine1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
