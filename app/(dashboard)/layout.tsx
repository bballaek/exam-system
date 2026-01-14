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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const pathname = usePathname();
  const isFullWidthPage = pathname?.endsWith("/edit");

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-surface">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icon name="menu" size="md" className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6e3ff3] to-[#aa8ef9] text-white">
              <Icon name="document" size="sm" className="text-white" />
            </div>
            <span className="font-semibold text-gray-900">MasterExam</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Page Content */}
        <div className={isFullWidthPage ? "" : "p-4 md:p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
}
