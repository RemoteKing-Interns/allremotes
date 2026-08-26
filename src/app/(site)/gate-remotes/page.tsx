import type { Metadata } from "next";
import { SEO_LANDING_PAGES } from "@/lib/seo-landing-pages";
import { SeoLandingPageView, buildLandingMetadata } from "../_components/SeoLandingPageView";

const page = SEO_LANDING_PAGES["gate-remotes"];

export const metadata: Metadata = buildLandingMetadata(page);

export default function GateRemotesPage() {
  return <SeoLandingPageView page={page} />;
}
