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

const Account = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('basics');

  const tabs = useMemo(
    () => [
      { id: 'basics', label: 'Account Basics', icon: 'AB' },
      { id: 'orders', label: 'Orders & Shopping', icon: 'OR' },
      { id: 'payments', label: 'Payments & Billing', icon: 'PY' },
      { id: 'addresses', label: 'Addresses', icon: 'AD' },
      { id: 'preferences', label: 'Preferences & Saved', icon: 'SV' },
      { id: 'reviews', label: 'Reviews & Interactions', icon: 'RV' },
      { id: 'notifications', label: 'Notifications & Settings', icon: 'NT' },
      { id: 'help', label: 'Help & Support', icon: 'HP' },
    ],
    [],
  );

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [router, user]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (!tabFromUrl) return;
    if (tabs.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, tabs]);

  if (!user) return null;

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-header">
          <div className="account-header-copy">
            <span className="account-kicker">Customer portal</span>
            <h1>My Account</h1>
            <p>Manage profile settings, orders, saved details, and support in one place.</p>
          </div>
          <div className="account-header-stats">
            <div className="account-stat">
              <strong>{tabs.length}</strong>
              <span>service sections</span>
            </div>
            <div className="account-stat">
              <strong>24/7</strong>
              <span>self-service access</span>
            </div>
            <div className="account-stat">
              <strong>Secure</strong>
              <span>order records</span>
            </div>
          </div>
        </div>

        <div className="account-content">
          <div className="account-sidebar">
            <div className="account-profile-summary">
              <div className="profile-avatar">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="account-profile-text">
                <h3>{user.name}</h3>
                <p className="account-profile-caption">Secure customer portal</p>
                <p>{user.email}</p>
                <div className="account-profile-meta">
                  <span className="account-profile-chip">Orders</span>
                  <span className="account-profile-chip">Saved Items</span>
                  <span className="account-profile-chip">Support</span>
                </div>
              </div>
            </div>

            <nav className="account-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`account-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  aria-pressed={activeTab === tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    router.replace(`/account?tab=${tab.id}`);
                  }}
                >
                  <span className="nav-icon">{tab.icon}</span>
                  <span className="nav-label">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="account-main">
            {activeTab === 'basics' && <AccountBasics />}
            {activeTab === 'orders' && <OrdersActivity />}
            {activeTab === 'payments' && <PaymentsBilling />}
            {activeTab === 'addresses' && <Addresses />}
            {activeTab === 'preferences' && <PreferencesSaved />}
            {activeTab === 'reviews' && <ReviewsInteractions />}
            {activeTab === 'notifications' && <NotificationsSettings />}
            {activeTab === 'help' && <HelpSupport />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
