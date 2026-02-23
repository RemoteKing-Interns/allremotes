import React, { useState } from 'react';
import './AccountSection.css';

const NotificationsSettings = () => {
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
    currency: 'USD',
    timezone: 'America/New_York'
  });

  const handleNotificationChange = (type, key) => {
    setNotifications({
      ...notifications,
      [type]: {
        ...notifications[type],
        [key]: !notifications[type][key]
      }
    });
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  return (
    <div className="account-section">
      <h2>Notifications & Settings</h2>
      
      <div className="section-content">
        <div className="notifications-section">
          <h3>Email Notifications</h3>
          <div className="notifications-list">
            {Object.entries(notifications.email).map(([key, value]) => (
              <div key={key} className="notification-item">
                <div>
                  <p className="notification-label">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <p className="notification-description">
                    {key === 'orderUpdates' && 'Get notified about your order status'}
                    {key === 'shippingUpdates' && 'Receive shipping and delivery updates'}
                    {key === 'promotions' && 'Receive special offers and promotions'}
                    {key === 'newsletters' && 'Get our monthly newsletter'}
                    {key === 'reviews' && 'Get notified when someone responds to your review'}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleNotificationChange('email', key)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="push-notifications-section">
          <h3>Push Notifications</h3>
          <div className="notifications-list">
            {Object.entries(notifications.push).map(([key, value]) => (
              <div key={key} className="notification-item">
                <div>
                  <p className="notification-label">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleNotificationChange('push', key)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="preferences-section">
          <h3>Language & Currency</h3>
          <form className="account-form">
            <div className="form-group">
              <label>Language</label>
              <select
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={preferences.currency}
                onChange={(e) => handlePreferenceChange('currency', e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            </div>
            <button type="button" className="btn btn-gradient">Save Preferences</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
