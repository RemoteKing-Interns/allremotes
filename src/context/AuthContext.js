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
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Admin login (no code change needed: use this email + password)
    const adminEmail = 'admin@allremotes.com';
    const adminPassword = 'Admin123!';
    if (email === adminEmail && password === adminPassword) {
      const userData = { id: 'admin', name: 'Admin', email: adminEmail, role: 'admin' };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    }
    // Regular user login
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userData = { ...foundUser };
      delete userData.password; // Don't store password in user state
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const register = (name, email, password) => {
    // Simple registration (in production, this would be an API call)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, this would be hashed
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

  const loginWithOAuth = (provider, userData) => {
    // Handle OAuth login (Google or Apple)
    // userData should contain: { id, name, email, provider, picture }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if user exists with this OAuth provider
    let existingUser = users.find(u => u.email === userData.email && u.provider === provider);
    
    if (!existingUser) {
      // Create new OAuth user
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

    const userToStore = { ...existingUser };
    delete userToStore.password;
    setUser(userToStore);
    localStorage.setItem('user', JSON.stringify(userToStore));
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const changePassword = (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not signed in' };

    const adminEmail = 'admin@allremotes.com';
    const adminPassword = 'Admin123!';
    if (user.email === adminEmail) {
      if (String(currentPassword) !== adminPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }
      return { success: false, error: 'Admin password is set in code and cannot be changed here' };
    }

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

  const updateUser = (updatedData) => {
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
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithOAuth, register, logout, updateUser, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
