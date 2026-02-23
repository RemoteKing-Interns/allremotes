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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
