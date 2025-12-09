"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon, { IconName } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";

interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
  href: string;
  badge?: string;
  disabled?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const menuItems: MenuItem[] = [
  { id: "DASHBOARD", label: "ภาพรวมการสอบ", icon: "document", href: "/" },
];

const adminMenuItems: MenuItem[] = [
  { id: "ADMIN_DASHBOARD", label: "Dashboard", icon: "chart", href: "/admin/dashboard" },
  { id: "EXAM_MANAGE", label: "การจัดการข้อสอบ", icon: "settings", href: "/admin/exams" },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out flex flex-col
          ${isCollapsed ? "w-16" : "w-72"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Area */}
        <div className={`h-16 flex items-center border-b border-gray-100 ${isCollapsed ? "px-3 justify-center" : "px-6"}`}>
          <div className="flex items-center gap-3 text-indigo-600">
            <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
              <Icon name="bookmark" size="sm" className="text-indigo-600" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-base text-gray-900 leading-none">Classroom</h1>
                <span className="text-[10px] text-indigo-500 font-semibold tracking-wider">MASTER</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? "px-2" : "px-3"}`}>
          {!isCollapsed && (
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Menu
            </p>
          )}

          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.disabled ? "#" : item.href}
              onClick={(e) => {
                if (item.disabled) e.preventDefault();
                else setIsMobileOpen(false);
              }}
              title={isCollapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium
                transition-all duration-200 mb-1
                ${isCollapsed ? "justify-center" : ""}
                ${isActive(item.href)
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : item.disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon
                name={item.icon}
                size="sm"
                className={isActive(item.href) ? "text-indigo-600" : ""}
              />
              {!isCollapsed && item.label}
            </Link>
          ))}

          {/* Admin Section - แสดงเมื่อ Login แล้วเท่านั้น */}
          {isLoggedIn && (
            <>
              {!isCollapsed && (
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                  Admin
                </p>
              )}
              {isCollapsed && <div className="my-3 border-t border-gray-200" />}

              {adminMenuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.disabled ? "#" : item.href}
                  onClick={(e) => {
                    if (item.disabled) e.preventDefault();
                    else setIsMobileOpen(false);
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200 mb-1
                    ${isCollapsed ? "justify-center" : ""}
                    ${isActive(item.href)
                      ? "bg-indigo-50 text-indigo-600 shadow-sm"
                      : item.disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon
                    name={item.icon}
                    size="sm"
                    className={isActive(item.href) ? "text-indigo-600" : ""}
                  />
                  {!isCollapsed && item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer - Login/Logout */}
        <div className={`p-3 border-t border-gray-100 ${isCollapsed ? "" : "space-y-2"}`}>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                text-red-500 hover:bg-red-50 transition-all w-full
                ${isCollapsed ? "justify-center" : ""}
              `}
              title={isCollapsed ? "ออกจากระบบ" : undefined}
            >
              <Icon name="arrow-left" size="sm" />
              {!isCollapsed && <span>ออกจากระบบ</span>}
            </button>
          ) : (
            <Link
              href="/login"
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                text-indigo-600 hover:bg-indigo-50 transition-all w-full
                ${isCollapsed ? "justify-center" : ""}
              `}
              title={isCollapsed ? "เข้าสู่ระบบ" : undefined}
            >
              <Icon name="user" size="sm" />
              {!isCollapsed && <span>เข้าสู่ระบบ (ครู)</span>}
            </Link>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all w-full
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "ขยาย" : "ย่อ"}
          >
            <Icon name={isCollapsed ? "arrow-right" : "arrow-left"} size="sm" />
            {!isCollapsed && <span>ย่อเมนู</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
