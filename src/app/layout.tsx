import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
  description:
    "ALLREMOTES Australia | Garage Door & Gate Remotes, Motors & Accessories",
  manifest: "/manifest.json",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e6b6f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
