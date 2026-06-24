"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { btn, tw } from './tw';
import { Check, Smartphone, Loader2 } from 'lucide-react';

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
  
  // Phone verification state
  const [phoneVerification, setPhoneVerification] = useState({
    isVerifying: false,
    otpSent: false,
    otp: '',
    tempPhone: '',
    loading: false,
    error: '',
    verified: user?.phoneVerified || false,
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        profilePhoto: user.profilePhoto || '',
      }));
      setPhoneVerification(prev => ({
        ...prev,
        verified: user.phoneVerified || false,
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setSaved(false);
    
    // Reset phone verification when phone changes
    if (name === 'phone') {
      setPhoneVerification(prev => ({
        ...prev,
        verified: value === user?.phone ? user?.phoneVerified : false,
        otpSent: false,
        error: '',
      }));
    }
  };
  
  const sendPhoneOTP = async () => {
    if (!formData.phone) {
      setPhoneVerification(prev => ({ ...prev, error: 'Please enter a phone number' }));
      return;
    }
    
    setPhoneVerification(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          email: user?.email,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPhoneVerification(prev => ({
          ...prev,
          otpSent: true,
          tempPhone: result.phone,
          loading: false,
        }));
      } else {
        setPhoneVerification(prev => ({
          ...prev,
          error: result.error || 'Failed to send verification code',
          loading: false,
        }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({
        ...prev,
        error: 'Failed to send verification code',
        loading: false,
      }));
    }
  };
  
  const verifyPhoneOTP = async () => {
    if (!phoneVerification.otp) {
      setPhoneVerification(prev => ({ ...prev, error: 'Please enter the verification code' }));
      return;
    }
    
    setPhoneVerification(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneVerification.tempPhone || formData.phone,
          otp: phoneVerification.otp,
          email: user?.email,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPhoneVerification(prev => ({
          ...prev,
          verified: true,
          isVerifying: false,
          otpSent: false,
          otp: '',
          loading: false,
          error: '',
        }));
        // Update form with verified phone
        setFormData(prev => ({ ...prev, phone: result.phone }));
      } else {
        setPhoneVerification(prev => ({
          ...prev,
          error: result.error || 'Invalid verification code',
          loading: false,
        }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({
        ...prev,
        error: 'Failed to verify code',
        loading: false,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Check if phone has been changed and not verified
    const phoneChanged = formData.phone !== user?.phone;
    const phoneNeedsVerification = phoneChanged && formData.phone && !phoneVerification.verified;
    
    if (phoneNeedsVerification) {
      setPhoneVerification(prev => ({
        ...prev,
        error: 'Please verify your phone number before saving',
      }));
      return;
    }
    
    // Only save verified fields
    const dataToSave = {
      name: formData.name,
      email: formData.email,
      profilePhoto: formData.profilePhoto,
    };
    
    // Only include phone if it's verified or unchanged
    if (phoneVerification.verified || !phoneChanged) {
      dataToSave.phone = formData.phone;
    }
    
    const result = await updateUser(dataToSave);
    if (result?.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleChangePassword = async (e) => {
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
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
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
                <label htmlFor="phone" className={tw.label}>
                  Phone Number
                  {phoneVerification.verified && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                      <Check size={14} /> Verified
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="04XX XXX XXX"
                    maxLength={15}
                    inputMode="tel"
                    autoComplete="tel"
                    className={`${tw.input} flex-1`}
                    disabled={phoneVerification.isVerifying}
                  />
                  {!phoneVerification.verified && formData.phone && (
                    <button
                      type="button"
                      onClick={sendPhoneOTP}
                      disabled={phoneVerification.loading}
                      className={`${btn.outline} whitespace-nowrap px-3`}
                    >
                      {phoneVerification.loading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : phoneVerification.otpSent ? (
                        'Resend'
                      ) : (
                        <>
                          <Smartphone size={16} className="mr-1" />
                          Verify
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {/* OTP Input */}
                {phoneVerification.otpSent && !phoneVerification.verified && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="mb-2 text-sm text-neutral-700">
                      Enter the 6-digit code sent to your phone
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={phoneVerification.otp}
                        onChange={(e) => setPhoneVerification(prev => ({ 
                          ...prev, 
                          otp: e.target.value.replace(/\D/g, '').slice(0, 6)
                        }))}
                        className={`${tw.input} w-32 text-center font-mono text-lg tracking-wider`}
                      />
                      <button
                        type="button"
                        onClick={verifyPhoneOTP}
                        disabled={phoneVerification.loading || phoneVerification.otp.length !== 6}
                        className={`${btn.gradient} px-4`}
                      >
                        {phoneVerification.loading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          'Confirm'
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {phoneVerification.error && (
                  <p className="mt-2 text-sm text-red-600">{phoneVerification.error}</p>
                )}
                
                {phoneVerification.verified && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Phone number verified. You can now receive SMS notifications.
                  </p>
                )}
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
