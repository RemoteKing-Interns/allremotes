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

const Account = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("basics");

  const tabs = useMemo(
    () => [
      { id: "basics", label: "Account Basics", icon: "AB" },
      { id: "orders", label: "Orders & Shopping", icon: "OR" },
      { id: "payments", label: "Payments & Billing", icon: "PY" },
      { id: "addresses", label: "Addresses", icon: "AD" },
      { id: "preferences", label: "Preferences & Saved", icon: "SV" },
      { id: "reviews", label: "Reviews & Interactions", icon: "RV" },
      { id: "notifications", label: "Notifications & Settings", icon: "NT" },
      { id: "help", label: "Help & Support", icon: "HP" },
    ],
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
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    tw.navItem,
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
                      activeTab === tab.id && tw.navIconActive,
                    )}
                  >
                    {tab.icon}
                  </span>
                  <span className={tw.navLabel}>{tab.label}</span>
                </button>
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
