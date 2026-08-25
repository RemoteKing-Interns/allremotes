"use client";

import React from "react";
import Link from "next/link";
import { Search, Store, ChevronDown, ChevronRight, PanelLeft, PanelLeftClose, ExternalLink } from "lucide-react";
import { NavItem, NavGroup, allNavItems, navGroupDefinitions } from "../shared/adminConstants";

interface AdminSidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
  expandedGroups: string[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<string[]>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadMessageCount: number;
  user: any;
  hasPermission: (key: string) => boolean;
  onOpenSearch: () => void;
}

export default function AdminSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  expandedGroups,
  setExpandedGroups,
  activeTab,
  setActiveTab,
  unreadMessageCount,
  user,
  hasPermission,
  onOpenSearch,
}: AdminSidebarProps) {
  const navItems = allNavItems.filter((item) => hasPermission(item.perm));
  const groupedIds = new Set(navGroupDefinitions.flatMap((g) => g.ids));
  const navGroups = navGroupDefinitions
    .map((g) => ({
      ...g,
      items: g.ids.map((id) => navItems.find((item) => item.id === id)).filter(Boolean) as NavItem[],
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside
      className={`${sidebarCollapsed ? "w-16" : "w-60"} flex-shrink-0 bg-[#1a1a1a] text-white transition-all duration-300 flex flex-col`}
    >
      {/* Logo Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">All Remotes</p>
              <p className="text-xs text-neutral-400">Admin</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Search */}
      {!sidebarCollapsed && (
        <div className="px-3 py-3">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-neutral-400 text-sm hover:bg-white/10 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <Search size={16} />
            <span>Search</span>
            <span className="ml-auto text-xs bg-white/10 px-1.5 py-0.5 rounded">⌘K</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          {sidebarCollapsed ? (
            navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === "messages" && unreadMessageCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                  title={item.label}
                >
                  <div className="relative">
                    <Icon size={18} className={isActive ? "text-emerald-400" : ""} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                        {unreadMessageCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <>
              {/* Top-level items that are not part of a group */}
              {navItems
                .filter((item) => !groupedIds.has(item.id))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon size={18} className={isActive ? "text-emerald-400" : ""} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

              {/* Grouped dropdowns */}
              {navGroups.map((group) => {
                const isExpanded = expandedGroups.includes(group.label);
                const groupActive = group.items.some((item) => item.id === activeTab);
                return (
                  <div key={group.label} className="space-y-0.5">
                    <button
                      onClick={() =>
                        setExpandedGroups((prev) =>
                          prev.includes(group.label) ? prev.filter((l) => l !== group.label) : [...prev, group.label]
                        )
                      }
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        groupActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <group.icon size={18} className={groupActive ? "text-emerald-400" : ""} />
                      <span className="flex-1 text-left">{group.label}</span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {isExpanded && (
                      <div className="pl-8 space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          const showBadge = item.id === "messages" && unreadMessageCount > 0;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <div className="relative">
                                <Icon size={18} className={isActive ? "text-emerald-400" : ""} />
                                {showBadge && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                    {unreadMessageCount}
                                  </span>
                                )}
                              </div>
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => setActiveTab("profile")}
          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} rounded-lg p-1 hover:bg-white/10 transition-colors`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
            </div>
          )}
        </button>
        {!sidebarCollapsed && (
          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-medium transition-colors"
            >
              <ExternalLink size={14} />
              View Store
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
