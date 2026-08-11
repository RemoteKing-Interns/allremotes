import type { Metadata } from "next";
import HomePage from "./_components/HomePage";

export const metadata: Metadata = {
  title: "ALLREMOTES Australia | Garage, Gate & Home Replacement Remotes",
  description:
    "Shop replacement garage door remotes, gate remotes, home automation remotes, keyless entry and accessories at ALLREMOTES Australia. Fast shipping, 30-day returns and expert support.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ALLREMOTES Australia | Garage, Gate & Home Replacement Remotes",
    description:
      "Shop replacement garage door remotes, gate remotes, home automation remotes and accessories. Fast shipping, 30-day returns and expert support.",
    url: "/",
  },
};

export default function Home() {
  return <HomePage />;
}
