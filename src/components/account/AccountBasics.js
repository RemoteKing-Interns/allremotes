"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const AccountBasics = () => {
  const { user, updateUser, changePassword } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profilePhoto: user?.profilePhoto || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSaved(false);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUser(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    const result = changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (!result?.success) {
      setPasswordError(result?.error || 'Failed to update password');
      return;
    }
    setPasswordSaved(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          profilePhoto: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="account-section">
      <h2>Account Basics</h2>
      
      <div className="section-content">
        <form onSubmit={handleSaveProfile} className="account-form">
          <div className="account-basics-grid">
            <div className="account-basics-aside">
              <div className="form-group-photo">
                <label>Profile Photo</label>
                <div className="photo-upload photo-upload-column">
                  <div className="photo-preview">
                    {formData.profilePhoto ? (
                      <img src={formData.profilePhoto} alt="Profile" />
                    ) : (
                      <div className="photo-placeholder">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <input
                    id="account-profile-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="file-input"
                  />
                  <label
                    htmlFor="account-profile-photo"
                    className="btn btn-outline"
                  >
                    Change Photo
                  </label>
                  <p className="account-photo-note">
                    Keep your account details current so orders, saved items, and support activity stay easy to manage.
                  </p>
                </div>
              </div>
            </div>

            <div className="account-basics-details">
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {saved && <div className="success-message">Profile updated successfully!</div>}

              <div className="account-submit-row">
                <button type="submit" className="btn btn-gradient">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="section-divider"></div>

        <div className="password-section">
          <h3>Password & Security</h3>
          <form onSubmit={handleChangePassword} className="account-form">
            {passwordError && <div className="error-message">{passwordError}</div>}
            {passwordSaved && <div className="success-message">Password updated.</div>}
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-secondary">
              Update Password
            </button>
          </form>
        </div>

        <div className="section-divider"></div>

        <div className="security-section">
          <h3>Two-Factor Authentication</h3>
          <div className="security-toggle">
            <div>
              <p className="security-label">Enable 2FA</p>
              <p className="security-description">Add an extra layer of security to your account</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => {
                  const next = e.target.checked;
                  setTwoFactorEnabled(next);
                  updateUser({ twoFactorEnabled: next });
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountBasics;
