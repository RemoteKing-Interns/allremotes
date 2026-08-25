"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, HelpCircle, LogOut } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  tab: string;
  threadId?: string;
}

interface AdminHeaderProps {
  activeTab: string;
  notifOpen: boolean;
  setNotifOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notifications: NotificationItem[];
  notifLoading: boolean;
  fetchNotifications: () => void;
  onNotifClick: (n: NotificationItem) => void;
  onLogout: () => void;
}

export default function AdminHeader({
  activeTab,
  notifOpen,
  setNotifOpen,
  notifications,
  notifLoading,
  fetchNotifications,
  onNotifClick,
  onLogout,
}: AdminHeaderProps) {
  const notifRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setNotifOpen]);

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-neutral-900 capitalize">
          {activeTab === "dashboard" ? "Home" : activeTab.replace("_", " ")}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              if (!notifOpen) fetchNotifications();
            }}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors relative"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-neutral-200 bg-white shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
                <span className="text-xs text-neutral-500">{notifications.length} items</span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-neutral-500">Loading…</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Bell size={28} className="mb-2 text-neutral-300" />
                    <p className="text-sm font-medium text-neutral-600">All clear!</p>
                    <p className="text-xs text-neutral-400 mt-1">No pending notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onNotifClick(n)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 text-left transition-colors"
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          n.type === "order"
                            ? "bg-blue-100 text-blue-600"
                            : n.type === "return"
                            ? "bg-amber-100 text-amber-600"
                            : n.type === "chat"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {n.type === "order" ? "🛒" : n.type === "return" ? "↩" : n.type === "chat" ? "💬" : "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{n.title}</p>
                        <p className="text-xs text-neutral-600 truncate mt-0.5">{n.body}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {new Date(n.time).toLocaleString("en-AU", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-neutral-200 px-4 py-2">
                <button
                  onClick={() => {
                    fetchNotifications();
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  {notifLoading ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors">
          <HelpCircle size={20} />
        </button>
        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
