import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const DISALLOWED_PATHS = [
  "/admin",
  "/api",
  "/account",
  "/cart",
  "/checkout",
  "/login",
  "/register",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
