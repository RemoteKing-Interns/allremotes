"use client";

import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Home,
  Megaphone,
  Compass,
  MessageSquareText,
  Settings,
  RotateCcw,
  Truck,
  Store,
  Tag,
  Percent,
  FileText,
  Image,
  Globe,
  Eye,
  Star,
  Layers,
  Wand2,
  Printer,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  perm: string;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  ids: string[];
}

export const STORAGE_KEYS = {
  home: "allremotes_home_content",
  navigation: "allremotes_navigation",
  reviews: "allremotes_reviews",
  promotions: "allremotes_promotions",
  settings: "allremotes_settings",
};

export const navGroupDefinitions: NavGroup[] = [
  { label: 'Sales',     icon: ShoppingCart, ids: ['orders', 'returns', 'abandoned_carts'] },
  { label: 'Catalog',   icon: Package,      ids: ['products', 'categories', 'inventory', 'image_gen'] },
  { label: 'Customers', icon: Users,        ids: ['customers', 'reviews', 'messages'] },
  { label: 'Marketing', icon: Megaphone,    ids: ['promotions', 'discounts'] },
  { label: 'Content',   icon: FileText,     ids: ['home', 'navigation', 'content'] },
  { label: 'Analytics', icon: BarChart3,    ids: ['analytics', 'live_view'] },
  { label: 'Channels',  icon: Globe,        ids: ['channels'] },
  { label: 'Admin',     icon: Settings,     ids: ['admin_users', 'admin_logs', 'printers', 'labels', 'document_design', 'settings'] },
];

export const allNavItems: NavItem[] = [
  { id: 'dashboard',      label: 'Home',               icon: Home,               perm: 'dashboard' },
  { id: 'orders',         label: 'Orders',              icon: ShoppingCart,       perm: 'orders' },
  { id: 'returns',        label: 'Returns',             icon: RotateCcw,          perm: 'orders' },
  { id: 'abandoned_carts',label: 'Abandoned Carts',     icon: Package,            perm: 'orders' },
  { id: 'products',       label: 'Products',            icon: Package,            perm: 'products' },
  { id: 'categories',     label: 'Categories & Brands', icon: Tags,               perm: 'products' },
  { id: 'inventory',      label: 'Inventory',           icon: Layers,             perm: 'products' },
  { id: 'image_gen',      label: 'AI Image Generator',  icon: Wand2,              perm: 'products' },
  { id: 'customers',      label: 'Customers',           icon: Users,              perm: 'customers' },
  { id: 'reviews',        label: 'Reviews',             icon: Star,               perm: 'customers' },
  { id: 'messages',       label: 'Messages/Queries',    icon: MessageSquareText,  perm: 'customers' },
  { id: 'promotions',     label: 'Promotions',          icon: Megaphone,          perm: 'marketing' },
  { id: 'discounts',      label: 'Discounts',           icon: Percent,            perm: 'marketing' },
  { id: 'home',           label: 'Homepage',            icon: FileText,           perm: 'content' },
  { id: 'navigation',     label: 'Navigation',          icon: Compass,            perm: 'content' },
  { id: 'content',        label: 'Content',             icon: Image,              perm: 'content' },
  { id: 'analytics',      label: 'Reports',             icon: BarChart3,          perm: 'analytics' },
  { id: 'live_view',      label: 'Live View',           icon: Eye,                perm: 'analytics' },
  { id: 'admin_users',    label: 'Admin Users',         icon: Users,              perm: 'superuser' },
  { id: 'admin_logs',     label: 'Logs',                icon: FileText,           perm: 'admin_users' },
  { id: 'printers',       label: 'Printer Setup',       icon: Printer,            perm: 'settings' },
  { id: 'labels',         label: 'Label Templates',     icon: Tags,               perm: 'settings' },
  { id: 'document_design', label: 'Document Design',    icon: FileText,           perm: 'settings' },
  { id: 'settings',       label: 'Settings',            icon: Settings,           perm: 'settings' },
  { id: 'channels',       label: 'Channels',            icon: Globe,              perm: 'channels' },
];

export const cmdkNavDefs = [
  { id: 'dashboard', label: 'Home' },
  { id: 'orders', label: 'Orders' },
  { id: 'returns', label: 'Returns' },
  { id: 'abandoned_carts', label: 'Abandoned Carts' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories & Brands' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'image_gen', label: 'AI Image Generator' },
  { id: 'customers', label: 'Customers' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'messages', label: 'Messages/Queries' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'discounts', label: 'Discounts' },
  { id: 'home', label: 'Homepage' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'analytics', label: 'Reports' },
  { id: 'live_view', label: 'Live View' },
  { id: 'admin_users', label: 'Admin Users' },
  { id: 'admin_logs', label: 'Logs' },
  { id: 'printers', label: 'Printer Setup' },
  { id: 'settings', label: 'Settings' },
];
