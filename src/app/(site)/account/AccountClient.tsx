"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import AccountBasics from "../../../components/account/AccountBasics";
import OrdersActivity from "../../../components/account/OrdersActivity";
import PaymentsBilling from "../../../components/account/PaymentsBilling";
import Addresses from "../../../components/account/Addresses";
import PreferencesSaved from "../../../components/account/PreferencesSaved";
import ReviewsInteractions from "../../../components/account/ReviewsInteractions";
import NotificationsSettings from "../../../components/account/NotificationsSettings";
import HelpSupport from "../../../components/account/HelpSupport";
import { tw } from "../../../components/account/tw";
import { cn } from "../../../lib/utils";
import {
  User,
  ShoppingBag,
  CreditCard,
  MapPin,
  Bookmark,
  Star,
  Bell,
  LifeBuoy,
} from "lucide-react";

const Account = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("basics");

  const tabs = useMemo(
    () => [
      { id: "basics", label: "Account Basics", icon: User },
      { id: "orders", label: "Orders & Shopping", icon: ShoppingBag },
      { id: "payments", label: "Payments & Billing", icon: CreditCard },
      { id: "addresses", label: "Addresses", icon: MapPin },
      { id: "preferences", label: "Preferences & Saved", icon: Bookmark },
      { id: "reviews", label: "Reviews & Interactions", icon: Star },
      { id: "notifications", label: "Notifications & Settings", icon: Bell },
      { id: "help", label: "Help & Support", icon: LifeBuoy },
    ],
    [],
  );

  const iconHoverStyles = useMemo(
    () => ({
      basics: {
        hover: "group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-700",
        active: "border-sky-300 bg-sky-100 text-sky-700",
      },
      orders: {
        hover: "group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700",
        active: "border-emerald-300 bg-emerald-100 text-emerald-700",
      },
      payments: {
        hover: "group-hover:border-violet-200 group-hover:bg-violet-50 group-hover:text-violet-700",
        active: "border-violet-300 bg-violet-100 text-violet-700",
      },
      addresses: {
        hover: "group-hover:border-amber-200 group-hover:bg-amber-50 group-hover:text-amber-700",
        active: "border-amber-300 bg-amber-100 text-amber-700",
      },
      preferences: {
        hover: "group-hover:border-rose-200 group-hover:bg-rose-50 group-hover:text-rose-700",
        active: "border-rose-300 bg-rose-100 text-rose-700",
      },
      reviews: {
        hover: "group-hover:border-fuchsia-200 group-hover:bg-fuchsia-50 group-hover:text-fuchsia-700",
        active: "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-700",
      },
      notifications: {
        hover: "group-hover:border-cyan-200 group-hover:bg-cyan-50 group-hover:text-cyan-700",
        active: "border-cyan-300 bg-cyan-100 text-cyan-700",
      },
      help: {
        hover: "group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700",
        active: "border-orange-300 bg-orange-100 text-orange-700",
      },
    }),
    [],
  );

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const fallbackTab = "basics";

    if (!tabFromUrl) {
      setActiveTab(fallbackTab);
      return;
    }

    if (tabs.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
      return;
    }

    setActiveTab(fallbackTab);
    router.replace(`/account?tab=${fallbackTab}`);
  }, [router, searchParams, tabs]);

  if (loading || !user) return null;

  return (
    <div className={tw.page}>
      <div className="mx-auto w-full max-w-[1328px] px-4 sm:px-6 lg:px-12">
        <div className={tw.header}>
          <div className={tw.headerCopy}>
            <h1 className={tw.headerTitle}>My Account</h1>
            <p className={tw.headerSubtitle}>
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <div className={tw.content}>
          <div className={tw.sidebar}>
            <div className={tw.profileSummary}>
              <div className={tw.profileAvatar}>
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.name}
                    className={tw.profileAvatarImg}
                  />
                ) : (
                  <div className={tw.profileAvatarFallback}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={tw.profileText}>
                <h3 className={tw.profileName}>{user.name}</h3>
                <p className={tw.profileEmail}>{user.email}</p>
              </div>
            </div>

            <nav className={tw.nav}>
              {tabs.map((tab) => (
                (() => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={cn(
                        tw.navItem,
                        "group",
                        activeTab === tab.id && tw.navItemActive,
                      )}
                      aria-pressed={activeTab === tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        router.replace(`/account?tab=${tab.id}`);
                      }}
                    >
                      <span
                        className={cn(
                          tw.navIcon,
                          iconHoverStyles[tab.id]?.hover,
                          activeTab === tab.id
                            ? iconHoverStyles[tab.id]?.active
                            : tw.navIconActive,
                        )}
                      >
                        <Icon size={16} strokeWidth={2.1} />
                      </span>
                      <span className={tw.navLabel}>{tab.label}</span>
                    </button>
                  );
                })()
              ))}
            </nav>
          </div>

          <div className={tw.main}>
            {activeTab === "basics" && <AccountBasics />}
            {activeTab === "orders" && <OrdersActivity />}
            {activeTab === "payments" && <PaymentsBilling />}
            {activeTab === "addresses" && <Addresses />}
            {activeTab === "preferences" && <PreferencesSaved />}
            {activeTab === "reviews" && <ReviewsInteractions />}
            {activeTab === "notifications" && <NotificationsSettings />}
            {activeTab === "help" && <HelpSupport />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
