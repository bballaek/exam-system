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
  disabled?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

// Menu for regular users (not logged in)
const userMenuItems: MenuItem[] = [
  { id: "EXAM", label: "Exam", icon: "document", href: "/" },
];

const userBottomMenuItems: MenuItem[] = [
  { id: "HELP", label: "Help", icon: "info", href: "#", disabled: true },
];

// Menu for admin (logged in)
const adminMenuItems: MenuItem[] = [
  { id: "EXAM", label: "Exam", icon: "document", href: "/" },
  { id: "SETTING", label: "Setting", icon: "settings", href: "/admin/exams" },
  { id: "DASHBOARD", label: "Dashboard", icon: "chart", href: "/admin/dashboard" },
  { id: "STATUS", label: "Status", icon: "eye", href: "/admin/status" },
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

  // Choose menu based on login status
  const menuItems = isLoggedIn ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          bg-gray-50 border-r border-gray-200
          transition-all duration-300 ease-in-out flex flex-col
          ${isCollapsed ? "w-[72px]" : "w-[260px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Area */}
        <div className={`h-16 flex items-center ${isCollapsed ? "px-3 justify-center" : "px-4"}`}>
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="MasterExam" className="w-9 h-9 flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-semibold text-[15px] text-gray-900">MasterExam</span>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? "px-2" : "px-3"}`}>
          {/* Admin Label */}
          {isLoggedIn && !isCollapsed && (
            <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Admin
            </p>
          )}

          {/* Menu Items */}
          <div className="space-y-1">
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
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                  transition-all duration-200
                  ${isCollapsed ? "justify-center" : ""}
                  ${item.disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : isActive(item.href)
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon
                  name={item.icon}
                  size="sm"
                  className={
                    item.disabled
                      ? "text-gray-300"
                      : isActive(item.href)
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover:text-gray-600"
                  }
                />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className={`border-t border-gray-100 py-3 ${isCollapsed ? "px-2" : "px-3"}`}>
          {/* Help menu for regular users */}
          {!isLoggedIn && (
            <div className="mb-2">
              {userBottomMenuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                    transition-all duration-200
                    ${isCollapsed ? "justify-center" : ""}
                    ${item.disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <Icon
                    name={item.icon}
                    size="sm"
                    className={item.disabled ? "text-gray-300" : "text-gray-400 group-hover:text-gray-600"}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          )}

          {/* Login / Logout Button */}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                text-red-500 hover:bg-red-50 transition-all duration-200
                ${isCollapsed ? "justify-center" : ""}
              `}
            >
              <Icon name="unlock" size="sm" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          ) : (
            <Link
              href="/login"
              title={isCollapsed ? "Login" : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200
                ${isCollapsed ? "justify-center" : ""}
              `}
            >
              <Icon name="user" size="sm" className="text-gray-400" />
              {!isCollapsed && <span>Login</span>}
            </Link>
          )}

          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
              text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-200 mt-2
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
          >
            <Icon 
              name={isCollapsed ? "sidebar-expand" : "sidebar-collapse"} 
              size="sm" 
              className="text-gray-400" 
            />
            {!isCollapsed && <span>ย่อเมนู</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
