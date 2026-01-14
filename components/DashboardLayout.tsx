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
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const pathname = usePathname();

  // Determine current page for nav highlighting
  const isAdminPage = pathname?.startsWith("/admin");
  const isExamsPage = pathname?.startsWith("/admin/exams");
  const isDashboardPage = pathname === "/admin/dashboard";

  const getPageTitle = () => {
    if (isDashboardPage) return "Dashboard";
    if (isExamsPage) return "การจัดการข้อสอบ";
    if (pathname?.startsWith("/admin/status")) return "Status";
    return "Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar Component */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b border-[#e5e5e5] bg-white sticky top-0 z-20 w-full">
          {/* Sidebar Toggle Button - Always visible */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              p-2 rounded-lg hover:bg-gray-50 transition-colors -ml-1 sm:-ml-2
              ${isCollapsed ? "bg-gray-100" : ""}
            `}
            title={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
          >
            <Icon 
              name={isCollapsed ? "sidebar-expand" : "sidebar-collapse"} 
              size="sm" 
              className="text-gray-500" 
            />
          </button>

          {/* Page Title */}
          <h1 className="text-base sm:text-lg font-medium flex-1 truncate text-gray-900">
            {getPageTitle()}
          </h1>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Header Toggle Button */}
            {isAdminPage && (
              <button
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title={isHeaderCollapsed ? "แสดงเมนู" : "ซ่อนเมนู"}
              >
                <Icon 
                  name={isHeaderCollapsed ? "chevron-down" : "chevron-up"} 
                  size="sm" 
                  className="text-gray-500" 
                />
              </button>
            )}
          </div>
        </header>

        {/* Collapsible Navigation Tabs */}
        {!isHeaderCollapsed && isAdminPage && (
          <div className="hidden lg:flex items-center justify-between border-b border-[#e5e5e5] bg-white px-3 sm:px-6 py-2">
            <nav className="flex items-center gap-2">
              <Link
                href="/admin/exams"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isExamsPage
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon name="document" size="xs" />
                <span>All</span>
              </Link>
              <Link
                href="/admin/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDashboardPage
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon name="chart" size="xs" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/admin/status"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname?.startsWith("/admin/status")
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon name="eye" size="xs" />
                <span>Status</span>
              </Link>
            </nav>
            {/* Collapse Button for Navigation Tabs */}
            <button
              onClick={() => setIsHeaderCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              title="ย่อเมนู"
            >
              <Icon 
                name="chevron-up" 
                size="sm" 
                className="text-gray-400" 
              />
            </button>
          </div>
        )}

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-[#e5e5e5] px-4 py-3">
          <div className="flex items-center justify-between">
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
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
