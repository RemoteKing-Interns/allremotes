"use client";

import React from "react";
import { AuthProvider } from "../context/AuthContext";
import { StoreProvider } from "../context/StoreContext";
import { CartProvider } from "../context/CartContext";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <Toaster position="bottom-right" />
        <CartProvider>{children}</CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
