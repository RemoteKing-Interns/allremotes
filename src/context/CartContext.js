"use client";

import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';
import { MEMBER_DISCOUNT_RATE, getLineTotal, getPriceBreakdown, isDiscountEligible } from '../utils/pricing';

const CartContext = createContext();
const MAX_CART_COOKIE_CHARS = 3500;

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user, loading } = useAuth();
  const { getPromotions } = useStore();
  const promotions = getPromotions();
  const hasDiscount = isDiscountEligible(user);
  const cartRef = useRef(cart);
  const prevUserKeyRef = useRef(null);

  const guestKey = 'cart_guest';

  const getUserKey = useCallback((u) => {
    if (!u) return null;
    return u.id || u.email || null;
  }, []);

  const makeUserCartKey = useCallback((key) => `cart_user_${key}`, []);

  const readCookie = useCallback((key) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }, []);

  const writeCookie = useCallback((key, value, days = 30) => {
    if (typeof document === 'undefined') return false;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    return true;
  }, []);

  const removeCookie = useCallback((key) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }, []);

  const safeParseCart = useCallback((value) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const readCartFromStorage = useCallback((key) => {
    const localValue = localStorage.getItem(key);
    if (localValue) return safeParseCart(localValue);
    const cookieValue = readCookie(key);
    return safeParseCart(cookieValue);
  }, [readCookie, safeParseCart]);

  const writeCartToStorage = useCallback((key, value) => {
    const payload = JSON.stringify(value || []);
    localStorage.setItem(key, payload);

    // Cookies are shared across ports on the same domain (e.g. localhost:3000 and localhost:3001).
    // If the cart cookie grows too large it can push request headers over Node/Express limits,
    // causing HTTP 431 errors on unrelated endpoints (like CSV uploads). Keep cookies small.
    const encodedLen = encodeURIComponent(payload).length;
    if (encodedLen > MAX_CART_COOKIE_CHARS) {
      removeCookie(key);
      return;
    }
    writeCookie(key, payload);
  }, [writeCookie, removeCookie]);

  const removeCartFromStorage = useCallback((key) => {
    removeCookie(key);
    localStorage.removeItem(key);
  }, [removeCookie]);

  const normalizeCart = useCallback((items) => {
    return (items || [])
      .filter((item) => item && item.id)
      .map((item) => ({
        ...item,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
  }, []);

  const mergeCarts = useCallback((...carts) => {
    const merged = new Map();
    carts.forEach((list) => {
      normalizeCart(list).forEach((item) => {
        const existing = merged.get(item.id);
        if (existing) {
          merged.set(item.id, {
            ...existing,
            quantity: existing.quantity + item.quantity,
          });
        } else {
          merged.set(item.id, { ...item });
        }
      });
    });
    return Array.from(merged.values());
  }, [normalizeCart]);

  const areCartsEqual = useCallback((a, b) => {
    const normA = normalizeCart(a).sort((x, y) => String(x.id).localeCompare(String(y.id)));
    const normB = normalizeCart(b).sort((x, y) => String(x.id).localeCompare(String(y.id)));
    if (normA.length !== normB.length) return false;
    for (let i = 0; i < normA.length; i += 1) {
      if (normA[i].id !== normB[i].id) return false;
      if (normA[i].quantity !== normB[i].quantity) return false;
    }
    return true;
  }, [normalizeCart]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    if (loading) return;
    const userKey = getUserKey(user);
    const prevKey = prevUserKeyRef.current;

    if (userKey && userKey !== prevKey) {
      const userCartKey = makeUserCartKey(userKey);
      const savedUserCart = readCartFromStorage(userCartKey);
      const guestCart = readCartFromStorage(guestKey);
      const currentCart = cartRef.current || [];
      const merged = mergeCarts(savedUserCart, currentCart, guestCart);
      if (!areCartsEqual(merged, currentCart)) {
        setCart(merged);
      }
      writeCartToStorage(userCartKey, merged);
      if (guestCart.length) {
        removeCartFromStorage(guestKey);
      }
    }

    if (!userKey) {
      const guestCart = readCartFromStorage(guestKey);
      if (!areCartsEqual(guestCart, cartRef.current)) {
        setCart(guestCart);
      }
    }

    prevUserKeyRef.current = userKey;
  }, [
    user,
    loading,
    getUserKey,
    makeUserCartKey,
    readCartFromStorage,
    mergeCarts,
    areCartsEqual,
    writeCartToStorage,
    removeCartFromStorage,
    guestKey,
  ]);

  useEffect(() => {
    if (loading) return;
    const userKey = getUserKey(user);
    if (userKey) {
      writeCartToStorage(makeUserCartKey(userKey), cart);
      return;
    }
    writeCartToStorage(guestKey, cart);
  }, [cart, user, loading, getUserKey, makeUserCartKey, writeCartToStorage, guestKey]);

  const addToCart = (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, Math.floor(Number(quantity) || 1));
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: qtyToAdd }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getItemPriceBreakdown = useCallback((item) => {
    return getPriceBreakdown(item?.price || 0, hasDiscount, { promotions, product: item });
  }, [hasDiscount, promotions]);

  const getItemUnitPrice = useCallback((item) => {
    return getItemPriceBreakdown(item).finalPrice;
  }, [getItemPriceBreakdown]);

  const getItemLineTotal = useCallback((item) => {
    return getLineTotal(item?.price || 0, item?.quantity || 1, hasDiscount, { promotions, product: item });
  }, [hasDiscount, promotions]);

  const getCartOriginalTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + getItemLineTotal(item), 0);
  }, [cart, getItemLineTotal]);

  const getCartDiscountTotal = useCallback(() => {
    return Math.max(0, getCartOriginalTotal() - getCartTotal());
  }, [getCartOriginalTotal, getCartTotal]);

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        hasDiscount,
        discountRate: MEMBER_DISCOUNT_RATE,
        getItemPriceBreakdown,
        getItemUnitPrice,
        getItemLineTotal,
        getCartOriginalTotal,
        getCartDiscountTotal,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
