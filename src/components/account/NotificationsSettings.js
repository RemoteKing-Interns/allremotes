"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { btn, tw } from './tw';

const NotificationsSettings = () => {
  const { user, updateUser } = useAuth();
  const { getSettings } = useStore();
  const siteSettings = getSettings?.() || {};

  const [notifications, setNotifications] = useState({
    email: {
      orderUpdates: true,
      shippingUpdates: true,
      promotions: false,
      newsletters: true,
      reviews: true
    },
    push: {
      orderUpdates: true,
      shippingUpdates: true,
      promotions: false
    }
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: siteSettings.currency || 'AUD',
    timezone: siteSettings.timezone || 'Australia/Melbourne'
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from user data on mount
  useEffect(() => {
    if (user?.notifications) {
      setNotifications(prev => ({ ...prev, ...user.notifications }));
    }
    if (user?.preferences) {
      setPreferences(prev => ({ ...prev, ...user.preferences }));
    }
    setLoading(false);
  }, [user]);

  const handleNotificationChange = (type, key) => {
    setNotifications({
      ...notifications,
      [type]: {
        ...notifications[type],
        [key]: !notifications[type][key]
      }
    });
    setSaved(false);
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value
    });
    setSaved(false);
  };

  const save = async () => {
    if (!user?.email) return;
    
    const result = await updateUser({ notifications, preferences });
    if (result?.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className={tw.section}>
        <h2 className={tw.sectionTitle}>Notifications & Settings</h2>
        <div className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Notifications & Settings</h2>
      
      <div className={tw.sectionContent}>
        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Email Notifications</h3>
          <div className={tw.gridList}>
            {Object.entries(notifications.email).map(([key, value]) => (
              <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 max-sm:flex-col max-sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    {key === 'orderUpdates' && 'Get notified about your order status'}
                    {key === 'shippingUpdates' && 'Receive shipping and delivery updates'}
                    {key === 'promotions' && 'Receive special offers and promotions'}
                    {key === 'newsletters' && 'Get our monthly newsletter'}
                    {key === 'reviews' && 'Get notified when someone responds to your review'}
                  </p>
                </div>
                <label className={tw.toggleWrap}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleNotificationChange('email', key)}
                    className={tw.toggleInput}
                  />
                  <span className={tw.toggleTrack}></span>
                  <span className={tw.toggleThumb}></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Push Notifications</h3>
          <div className={tw.gridList}>
            {Object.entries(notifications.push).map(([key, value]) => (
              <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 max-sm:flex-col max-sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                </div>
                <label className={tw.toggleWrap}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleNotificationChange('push', key)}
                    className={tw.toggleInput}
                  />
                  <span className={tw.toggleTrack}></span>
                  <span className={tw.toggleThumb}></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Language & Currency</h3>
          <form className={tw.form}>
            <div className={tw.formGroup}>
              <label className={tw.label}>Language</label>
              <select
                className={tw.input}
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div className={tw.formGroup}>
              <label className={tw.label}>Currency</label>
              <select
                className={tw.input}
                value={preferences.currency}
                onChange={(e) => handlePreferenceChange('currency', e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
            <div className={tw.formGroup}>
              <label className={tw.label}>Timezone</label>
              <select
                className={tw.input}
                value={preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Australia/Melbourne">Melbourne</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
            {saved && <div className={tw.success}>Saved.</div>}
            <button type="button" className={btn.gradient} onClick={save}>Save Preferences</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
