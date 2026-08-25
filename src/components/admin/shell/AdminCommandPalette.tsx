"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cmdkNavDefs } from "../shared/adminConstants";

export interface CmdkResult {
  type: string;
  label: string;
  sub?: string;
  action: () => void;
}

interface AdminCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  setViewOrderId: (id: string | null) => void;
}

export default function AdminCommandPalette({
  open,
  onClose,
  setActiveTab,
  setViewOrderId,
}: AdminCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CmdkResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when palette opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build results whenever query changes
  useEffect(() => {
    if (!open) return;
    const q = query.toLowerCase().trim();

    const navResults: CmdkResult[] = [];

    cmdkNavDefs.forEach(({ id, label }) => {
      if (q === "" || label.toLowerCase().includes(q) || id.includes(q)) {
        navResults.push({
          type: "nav",
          label,
          sub: "Go to page",
          action: () => {
            setActiveTab(id);
            onClose();
          },
        });
      }
    });

    setResults(navResults);
    setSelectedIndex(0);

    // Fetch-based search (orders + products) — only when there's a query
    if (q.length >= 2) {
      fetch(`/api/orders?limit=200`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data: any[]) => {
          if (!Array.isArray(data)) return;
          const matches = data
            .filter((o: any) => {
              const txt = [o.id, o.customer?.email, o.customer?.fullName, o.status]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return txt.includes(q);
            })
            .slice(0, 5);
          if (matches.length === 0) return;
          setResults((prev) => [
            ...prev.filter((r) => r.type !== "order"),
            ...matches.map((o: any) => ({
              type: "order",
              label: `Order #${o.id}`,
              sub: `${o.customer?.email || "Guest"} · ${o.status}`,
              action: () => {
                setActiveTab("orders");
                setViewOrderId(o.id);
                onClose();
              },
            })),
          ]);
        })
        .catch(() => null);

      fetch(`/api/products`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data: any[]) => {
          if (!Array.isArray(data)) return;
          const matches = data
            .filter((p: any) => {
              const txt = [p.name, p.sku, p.rk_sku, p.brand, p.category]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return txt.includes(q);
            })
            .slice(0, 5);
          if (matches.length === 0) return;
          setResults((prev) => [
            ...prev.filter((r) => r.type !== "product"),
            ...matches.map((p: any) => ({
              type: "product",
              label: p.name,
              sub: `${p.sku || p.rk_sku || ""} · ${p.category || ""}`,
              action: () => {
                setActiveTab("products");
                onClose();
              },
            })),
          ]);
        })
        .catch(() => null);
    }
  }, [query, open, setActiveTab, setViewOrderId, onClose]);

  if (!open) return null;

  const typeLabel: Record<string, string> = { nav: "Pages", order: "Orders", product: "Products" };
  let lastType = "";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
          }
          if (e.key === "Enter" && results[selectedIndex]) {
            results[selectedIndex].action();
          }
          if (e.key === "Escape") onClose();
        }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search orders, products, pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <kbd className="text-[11px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-400">No results found</p>
          ) : (
            results.map((r, i) => {
              const showHeading = r.type !== lastType;
              lastType = r.type;
              return (
                <div key={i}>
                  {showHeading && (
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {typeLabel[r.type] || r.type}
                    </p>
                  )}
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selectedIndex ? "bg-violet-50 text-violet-900" : "hover:bg-neutral-50 text-neutral-800"
                    }`}
                    onClick={r.action}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span
                      className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        r.type === "order"
                          ? "bg-blue-100 text-blue-700"
                          : r.type === "product"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {r.type === "order" ? "#" : r.type === "product" ? "P" : "→"}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{r.label}</span>
                      {r.sub && <span className="block text-xs text-neutral-400 truncate">{r.sub}</span>}
                    </span>
                    {i === selectedIndex && (
                      <kbd className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded font-mono shrink-0">
                        ↵
                      </kbd>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-neutral-100 text-[11px] text-neutral-400">
          <span>
            <kbd className="bg-neutral-100 px-1 rounded font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="bg-neutral-100 px-1 rounded font-mono">↵</kbd> select
          </span>
          <span>
            <kbd className="bg-neutral-100 px-1 rounded font-mono">ESC</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
