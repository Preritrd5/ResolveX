"use client";

import React, { useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/navigation/sidebar";
import { Header } from "@/components/navigation/header";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-[#24283A] relative">
      {/* Calm, consistent atmospheric background for all authenticated dashboard pages */}
      <AtmosphericBackground variant="app" />

      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Mobile Slide-Over Drawer */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent relative">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
