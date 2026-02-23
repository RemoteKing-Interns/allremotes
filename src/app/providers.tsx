"use client";

import React from "react";
import { AuthProvider } from "../context/AuthContext";
import { StoreProvider } from "../context/StoreContext";
import { CartProvider } from "../context/CartContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>{children}</CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

