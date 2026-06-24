"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Never trust admin role from localStorage — must be verified by server
        if (parsed?.role === 'admin') {
          localStorage.removeItem('user');
        } else {
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Try API login first
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        const userData = result.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }

      return { 
        success: false, 
        error: result.error || 'Invalid email or password',
        emailNotVerified: result.emailNotVerified,
        email: result.email
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Unable to connect. Please try again.' };
    }
  };

  // Local login fallback (customer accounts only — admin must use server API)
  const loginLocal = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userData = { ...foundUser };
      delete userData.password;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const register = async (name, email, password) => {
    try {
      // Try API registration first
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        const userData = result.user;
        // Only auto-login if email is verified, otherwise require verification
        if (!result.verificationRequired) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        return { 
          success: true, 
          verificationRequired: result.verificationRequired,
          message: result.message 
        };
      }

      // If API fails, fall back to localStorage for development/offline
      if (response.status >= 500) {
        console.warn('API registration failed, falling back to localStorage');
        return registerLocal(name, email, password);
      }

      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      // Fallback to localStorage
      return registerLocal(name, email, password);
    }
  };

  // Local registration fallback
  const registerLocal = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // Note: Not hashed in localStorage fallback
      provider: 'email',
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const userData = { ...newUser };
    delete userData.password;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    return { success: true };
  };

  const loginWithOAuth = async (provider, userData) => {
    // Handle OAuth login (Google or Apple)
    // userData should contain: { id, name, email, provider, picture }
    
    try {
      // Save user to database via API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userData.id || `${provider}_${Date.now()}`,
          name: userData.name,
          email: userData.email,
          provider: provider,
          picture: userData.picture || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to save user to database:', result.error);
        // Continue with localStorage fallback
      }

      // Also save to localStorage for offline access
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      let existingUser = users.find(u => u.email === userData.email && u.provider === provider);
      
      if (!existingUser) {
        const newUser = {
          id: userData.id || `${provider}_${Date.now()}`,
          name: userData.name,
          email: userData.email,
          provider: provider,
          picture: userData.picture || null,
          createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        existingUser = newUser;
      }

      const userToStore = result.success ? { ...result.user } : { ...existingUser };
      delete userToStore.password;
      delete userToStore._id; // Remove MongoDB _id from client state
      
      setUser(userToStore);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      return { success: true };
    } catch (error) {
      console.error('Error in loginWithOAuth:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not signed in' };

    // Try API first
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      }

      // If API fails with server error, fall back to localStorage
      if (response.status >= 500) {
        console.warn('API change password failed, falling back to localStorage');
        return changePasswordLocal(currentPassword, newPassword);
      }

      return { success: false, error: result.error || 'Failed to change password', passwordErrors: result.passwordErrors };
    } catch (error) {
      console.error('Change password error:', error);
      // Fallback to localStorage
      return changePasswordLocal(currentPassword, newPassword);
    }
  };

  // Local change password fallback
  const changePasswordLocal = (currentPassword, newPassword) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return { success: false, error: 'User not found' };
    if (String(users[idx].password || '') !== String(currentPassword || '')) {
      return { success: false, error: 'Current password is incorrect' };
    }
    users[idx] = { ...users[idx], password: String(newPassword || '') };
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true };
  };

  const updateUser = async (updatedData) => {
    if (!user?.email) return { success: false, error: 'Not signed in' };
    
    try {
      // Update via API
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          updates: updatedData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true };
      }
      
      // API failed - fallback to localStorage
      console.warn('API update failed, falling back to localStorage');
      return updateUserLocal(updatedData);
    } catch (error) {
      console.error('Update user error:', error);
      // Fallback to localStorage
      return updateUserLocal(updatedData);
    }
  };
  
  // Local fallback for updateUser
  const updateUserLocal = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Also update in users array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedData };
      localStorage.setItem('users', JSON.stringify(users));
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithOAuth, register, logout, updateUser, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
