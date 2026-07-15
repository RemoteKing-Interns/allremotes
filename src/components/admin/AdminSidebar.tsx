"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Star,
  MessageSquareText,
  Tags,
  Layers,
  RotateCcw,
  Megaphone,
  Percent,
  FileText,
  Compass,
  Image as ImageIcon,
  BarChart3,
  Eye,
  Printer,
  Settings,
  Store,
  PanelLeft,
  PanelLeftClose,
  Home,
} from "lucide-react";

const navGroups = [
  {
    label: "Sales",
    icon: ShoppingCart,
    items: [
      { id: "orders", label: "Orders", icon: ShoppingCart, href: "/admin?tab=orders" },
      { id: "returns", label: "Returns", icon: RotateCcw, href: "/admin?tab=returns" },
      { id: "abandoned_carts", label: "Abandoned Carts", icon: Package, href: "/admin?tab=abandoned_carts" },
    ],
  },
  {
    label: "Catalog",
    icon: Package,
    items: [
      { id: "products", label: "Products", icon: Package, href: "/admin?tab=products" },
      { id: "categories", label: "Categories & Brands", icon: Tags, href: "/admin?tab=categories" },
      { id: "inventory", label: "Inventory", icon: Layers, href: "/admin?tab=inventory" },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    items: [
      { id: "customers", label: "Customers", icon: Users, href: "/admin?tab=customers" },
      { id: "reviews", label: "Reviews", icon: Star, href: "/admin?tab=reviews" },
      { id: "messages", label: "Messages/Queries", icon: MessageSquareText, href: "/admin?tab=messages" },
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    items: [
      { id: "promotions", label: "Promotions", icon: Megaphone, href: "/admin?tab=promotions" },
      { id: "discounts", label: "Discounts", icon: Percent, href: "/admin?tab=discounts" },
    ],
  },
  {
    label: "Content",
    icon: FileText,
    items: [
      { id: "home", label: "Homepage", icon: FileText, href: "/admin?tab=home" },
      { id: "navigation", label: "Navigation", icon: Compass, href: "/admin?tab=navigation" },
      { id: "content", label: "Content", icon: ImageIcon, href: "/admin?tab=content" },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    items: [
      { id: "analytics", label: "Reports", icon: BarChart3, href: "/admin?tab=analytics" },
      { id: "live_view", label: "Live View", icon: Eye, href: "/admin?tab=live_view" },
    ],
  },
  {
    label: "Admin",
    icon: Settings,
    items: [
      { id: "admin_users", label: "Admin Users", icon: Users, href: "/admin?tab=admin_users" },
      { id: "admin_logs", label: "Logs", icon: FileText, href: "/admin?tab=admin_logs" },
      { id: "printers", label: "Printer Setup", icon: Printer, href: "/admin?tab=printers" },
      { id: "labels", label: "Label Templates", icon: FileText, href: "/admin/settings/labels" },
      { id: "settings", label: "Settings", icon: Settings, href: "/admin?tab=settings" },
    ],
  },
];

export default function AdminSidebar({ activeId }: { activeId?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(navGroups.map(g => g.label));

  const toggleGroup = (label: string) => {
    setExpanded(prev => prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]);
  };

  const isActive = (id: string, href: string) => {
    if (activeId === id) return true;
    if (href.includes("/admin/settings/labels") && pathname === "/admin/settings/labels") return true;
    return false;
  };

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} flex-shrink-0 bg-[#1a1a1a] text-white transition-all duration-300 flex flex-col h-screen sticky top-0`}>
      {/* Logo Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Store size={18} className="text-white" />
            </div>
            <span className="font-bold text-white">All Remotes</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto">
            <Store size={18} className="text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Dashboard link */}
      <div className="px-2 py-2 border-b border-white/5">
        <Link
          href="/admin"
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/admin" ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <LayoutDashboard size={18} className="shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expanded.includes(group.label);
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-white transition-colors`}
                >
                  <GroupIcon size={18} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <span className="text-xs">{isExpanded ? "−" : "+"}</span>
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.id, item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            active ? "bg-white/10 text-white font-medium" : "text-neutral-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon size={16} className="shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom links */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/"
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2 rounded-lg text-sm text-neutral-400 hover:bg-white/5 hover:text-white transition-colors`}
        >
          <Home size={18} className="shrink-0" />
          {!collapsed && <span>View Store</span>}
        </Link>
      </div>
    </aside>
  );
}
