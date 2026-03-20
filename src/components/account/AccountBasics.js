"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { btn, tw } from './tw';

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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Account Basics</h2>
      
      <div className={tw.sectionContent}>
        <form onSubmit={handleSaveProfile} className={tw.form}>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] xl:gap-8 max-xl:grid-cols-1 max-xl:gap-4">
            <div className="min-w-0 xl:max-w-[12rem] xl:pr-1">
              <div className={tw.formGroup}>
                <label className={tw.label}>Profile Photo</label>
                <div className="flex w-full flex-col items-center gap-3 max-xl:flex-row max-xl:flex-wrap max-xl:items-center max-sm:flex-col max-sm:items-center">
                  <div className="h-28 w-28 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
                    {formData.profilePhoto ? (
                      <img
                        src={formData.profilePhoto}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/15 to-accent-light/30 text-3xl font-black text-neutral-700">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <input
                    id="account-profile-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className={tw.fileInput}
                  />
                  <label
                    htmlFor="account-profile-photo"
                    className={`${btn.outline} w-full justify-center max-xl:w-auto max-sm:w-full`}
                  >
                    Change Photo
                  </label>
                </div>
              </div>
            </div>

            <div className="grid gap-3.5 xl:border-l xl:border-neutral-200 xl:pl-8">
              <div className={tw.formRow2}>
                <div className={tw.formGroup}>
                  <label htmlFor="name" className={tw.label}>Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={tw.input}
                  />
                </div>

                <div className={tw.formGroup}>
                  <label htmlFor="email" className={tw.label}>Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={tw.input}
                  />
                </div>
              </div>

              <div className={tw.formGroup}>
                <label htmlFor="phone" className={tw.label}>Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+61"
                  maxLength={15}
                  inputMode="tel"
                  autoComplete="tel"
                  className={tw.input}
                />
              </div>

              {saved && <div className={tw.success}>Profile updated successfully!</div>}

              <div className="flex justify-start pt-1">
                <button type="submit" className={btn.gradient}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Password & Security</h3>
          <form onSubmit={handleChangePassword} className={tw.form}>
            {passwordError && <div className={tw.error}>{passwordError}</div>}
            {passwordSaved && <div className={tw.success}>Password updated.</div>}
            <div className={tw.formGroup}>
              <label htmlFor="currentPassword" className={tw.label}>Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className={tw.input}
              />
            </div>

            <div className={tw.formGroup}>
              <label htmlFor="newPassword" className={tw.label}>New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className={tw.input}
              />
            </div>

            <div className={tw.formGroup}>
              <label htmlFor="confirmPassword" className={tw.label}>Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className={tw.input}
              />
            </div>

            <button type="submit" className={btn.secondary}>
              Update Password
            </button>
          </form>
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Two-Factor Authentication</h3>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div>
              <p className="text-sm font-bold text-neutral-800">Enable 2FA</p>
              <p className="text-xs text-neutral-600">Add an extra layer of security to your account</p>
            </div>
            <label className={tw.toggleWrap}>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => {
                  const next = e.target.checked;
                  setTwoFactorEnabled(next);
                  updateUser({ twoFactorEnabled: next });
                }}
                className={tw.toggleInput}
              />
              <span className={tw.toggleTrack}></span>
              <span className={tw.toggleThumb}></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountBasics;
