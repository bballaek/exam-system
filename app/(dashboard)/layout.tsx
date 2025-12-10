"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const pathname = usePathname();
  const isFullWidthPage = pathname?.endsWith("/edit");

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Icon name="menu" size="md" />
          </button>
          <h1 className="font-bold text-gray-900">MasterExam</h1>
          <div className="w-10" />
        </div>

        {/* Page Content */}
        <div className={isFullWidthPage ? "" : "p-4 lg:p-6"}>
          {children}
        </div>
      </main>
    </div>
  );
}
