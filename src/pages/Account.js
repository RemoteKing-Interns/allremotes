import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountBasics from '../components/account/AccountBasics';
import OrdersActivity from '../components/account/OrdersActivity';
import PaymentsBilling from '../components/account/PaymentsBilling';
import Addresses from '../components/account/Addresses';
import PreferencesSaved from '../components/account/PreferencesSaved';
import ReviewsInteractions from '../components/account/ReviewsInteractions';
import NotificationsSettings from '../components/account/NotificationsSettings';
import HelpSupport from '../components/account/HelpSupport';
import './Account.css';

const Account = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('basics');

  const tabs = useMemo(
    () => [
      { id: 'basics', label: 'Account Basics', icon: '🧍' },
      { id: 'orders', label: 'Orders & Shopping', icon: '📦' },
      { id: 'payments', label: 'Payments & Billing', icon: '💳' },
      { id: 'addresses', label: 'Addresses', icon: '🚚' },
      { id: 'preferences', label: 'Preferences & Saved', icon: '❤️' },
      { id: 'reviews', label: 'Reviews & Interactions', icon: '⭐' },
      { id: 'notifications', label: 'Notifications & Settings', icon: '🔔' },
      { id: 'help', label: 'Help & Support', icon: '🛟' },
    ],
    [],
  );

  useEffect(() => {
    if (!user) navigate('/login');
  }, [navigate, user]);

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(location.search).get('tab');
    if (!tabFromUrl) return;
    if (tabs.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search, tabs]);

  if (!user) return null;

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-header">
          <h1>My Account</h1>
          <p>Manage your account settings and preferences</p>
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
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>

            <nav className="account-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`account-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    navigate(
                      { pathname: '/account', search: `?tab=${tab.id}` },
                      { replace: true },
                    );
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
