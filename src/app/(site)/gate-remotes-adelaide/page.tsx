import type { Metadata } from "next";
import { LOCATION_PAGES } from "@/lib/location-pages";
import { LocationPageView, buildLocationMetadata } from "../_components/LocationPageView";

const page = LOCATION_PAGES["gate-remotes-adelaide"];
export const metadata: Metadata = buildLocationMetadata(page);
export default function GateRemotesAdelaidePage() {
  return <LocationPageView page={page} />;
}
