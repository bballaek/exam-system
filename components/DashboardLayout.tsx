"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false); // Default expanded
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Determine current page for nav highlighting
  const isAdminPage = pathname?.startsWith("/admin");
  const isExamsPage = pathname?.startsWith("/admin/exams");
  const isDashboardPage = pathname === "/admin/dashboard";

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar Component */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Desktop Header Nav */}
        <header className="hidden lg:flex sticky top-0 z-20 bg-white border-b border-gray-200 h-14">
          <div className="flex items-center justify-between w-full px-4">
            {/* Left: Collapse Button + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
              >
                <Icon 
                  name={isCollapsed ? "arrow-right" : "arrow-left"} 
                  size="sm" 
                  className="text-gray-500" 
                />
              </button>
              <div className="h-5 w-px bg-gray-200" />
              <h1 className="text-base font-semibold text-gray-900">
                {isDashboardPage ? "Admin Dashboard" : isExamsPage ? "การจัดการข้อสอบ" : "Admin Dashboard"}
              </h1>
            </div>

            {/* Center: Navigation Tabs (for admin pages) */}
            {isAdminPage && (
              <nav className="flex items-center gap-1">
                <Link
                  href="/admin/exams"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isExamsPage
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon name="document" size="xs" />
                  ทุกชุดข้อสอบ
                </Link>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDashboardPage
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon name="chart" size="xs" />
                  Dashboard
                </Link>
              </nav>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {isAdminPage && (
                <>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Icon name="filter" size="xs" />
                    Filter
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Icon name="sort" size="xs" />
                    Sort by
                  </button>
                  <div className="h-5 w-px bg-gray-200 mx-1" />
                  <Link
                    href="/admin/exams"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Icon name="settings" size="xs" />
                    จัดการ
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon name="menu" size="md" className="text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Icon name="bookmark" size="sm" className="text-indigo-600" />
              </div>
              <span className="font-bold text-gray-900">MasterExam</span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon name="settings" size="md" className="text-gray-700" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
