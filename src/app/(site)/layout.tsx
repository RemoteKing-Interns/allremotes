import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MaintenanceGate from "../../components/MaintenanceGate";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaintenanceGate>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 min-w-0">{children}</main>
        <Footer />
      </div>
    </MaintenanceGate>
  );
}

