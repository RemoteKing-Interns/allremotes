import type { Metadata, Viewport } from "next";
import { getMetadataBase } from "@/lib/site-url";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title:
    "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
  description:
    "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(26,122,110,0.06),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.05),transparent_26%),linear-gradient(180deg,#f7fcfa_0%,#fbf8f5_46%,#e7f3ef_100%)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
