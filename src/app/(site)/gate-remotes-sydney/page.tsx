import type { Metadata } from "next";
import { LOCATION_PAGES } from "@/lib/location-pages";
import { LocationPageView, buildLocationMetadata } from "../_components/LocationPageView";

const page = LOCATION_PAGES["gate-remotes-sydney"];
export const metadata: Metadata = buildLocationMetadata(page);
export default function GateRemotesSydneyPage() {
  return <LocationPageView page={page} />;
}
