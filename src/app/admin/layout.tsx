import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="App">
      <main>{children}</main>
    </div>
  );
}

