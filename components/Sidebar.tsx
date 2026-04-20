"use client";

import React from "react";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DocumentIcon,
  SettingsIcon,
  ChartIcon,
  UsersIcon,
  EyeIcon,
  UserIcon,
  LogoutIcon,
  InfoIcon,
} from "@/assets/sidebarVercelIcons";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  isCollapsed?: boolean;
}

// Animated sidebar toggle icon
const SidebarToggleIcon: React.FC<IconProps> = ({
  size = 20,
  className = "",
  isCollapsed = false,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={twMerge("group", className)}
      fill="currentColor"
      {...props}
    >
      <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" />
      <rect
        className={twMerge(
          "transition-all duration-150 ease-in-out",
          isCollapsed 
            ? "w-[3px] group-hover:w-[6px]" 
            : "w-[6px] group-hover:w-[3px]"
        )}
        x="2"
        y="3"
        height="10"
        rx="1"
      />
    </svg>
  );
};


interface MenuItem {
  id: string;
  label: string;
  icon: React.FC<{ size?: number | string; className?: string }>;
  href: string;
  disabled?: boolean;
}

// Menu for regular users (not logged in)
const userMenuItems: MenuItem[] = [
  { id: "EXAM", label: "Exam", icon: DocumentIcon, href: "/" },
];

const userBottomMenuItems: MenuItem[] = [
  { id: "HELP", label: "Help", icon: InfoIcon, href: "#", disabled: true },
];

// Menu for admin (logged in)
const adminMenuItems: MenuItem[] = [
  { id: "EXAM", label: "Exam", icon: DocumentIcon, href: "/" },
  { id: "MANAGE", label: "Manage Exam", icon: SettingsIcon, href: "/admin/exams" },
  { id: "DASHBOARD", label: "Dashboard", icon: ChartIcon, href: "/admin/dashboard" },
  { id: "LEARNERS", label: "Learners", icon: UsersIcon, href: "/admin/learners" },
  { id: "PREPOST", label: "Pre-Post Analysis", icon: ChartIcon, href: "/admin/prepost" },
  { id: "PROGRESS", label: "Progress", icon: EyeIcon, href: "/admin/status" },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

function SidebarContent({
  mode,
  isLoggedIn,
  menuItems,
  isActive,
  onCloseMobile,
  onLogout,
}: {
  mode: "desktop" | "mobile";
  isLoggedIn: boolean;
  menuItems: MenuItem[];
  isActive: (href: string) => boolean;
  onCloseMobile: () => void;
  onLogout: () => Promise<void> | void;
}) {
  return (
    <div className="flex flex-col h-full">
      {mode === "mobile" && (
        <div className="px-4 pt-4 pb-3 border-b border-gray-200/70 bg-white/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo-light.svg" alt="MasterExam" className="w-9 h-9 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-[15px] text-gray-900 leading-tight truncate">
                  MasterExam
                </div>
                <div className="text-[11px] text-gray-400 leading-tight truncate">เมนู</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 4l8 8M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Logo Area */}
      <div className={twMerge("py-4 px-4", mode === "mobile" && "hidden")}>
        <div className="flex items-center gap-3">
          <img src="/logo-light.svg" alt="MasterExam" className="w-9 h-9 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-gray-900 leading-tight">MasterExam</span>
            <span className="text-[11px] text-gray-400 leading-tight">by Aekkarat Wongchalee</span>
          </div>
        </div>
      </div>

      {/* New Exam Button */}
      {isLoggedIn && (
        <div className="px-3 pt-2">
          <Link
            href="/admin/exams"
            onClick={onCloseMobile}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[14px] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>New Exam</span>
          </Link>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Admin Label */}
        {isLoggedIn && (
          <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Admin
          </p>
        )}

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.id}
                href={item.disabled ? "#" : item.href}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                  else onCloseMobile();
                }}
                className={twMerge(
                  "group/item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                  item.disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : isActive(item.href)
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <IconComponent
                  size={18}
                  className={
                    item.disabled
                      ? "text-gray-300"
                      : isActive(item.href)
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover/item:text-gray-600"
                  }
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-100 py-3 px-3">
        {/* Help menu for regular users */}
        {!isLoggedIn && (
          <div className="mb-2">
            {userBottomMenuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={twMerge(
                    "group/item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                    item.disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <IconComponent
                    size={18}
                    className={item.disabled ? "text-gray-300" : "text-gray-400 group-hover/item:text-gray-600"}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Login / Logout Button */}
        {isLoggedIn ? (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogoutIcon size={18} />
            <span>Logout</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
          >
            <UserIcon size={18} className="text-gray-400" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

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

  // Mobile drawer UX: lock scroll + ESC close
  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen, setIsMobileOpen]);

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

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Choose menu based on login status
  const menuItems = isLoggedIn ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className={twMerge(
            "fixed inset-0 z-30 lg:hidden bg-black/50 backdrop-blur-[2px] transition-opacity duration-200",
            isMobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar - Normal (not collapsed) */}
      <aside
        className={twMerge(
          "hidden lg:flex flex-col h-screen bg-gray-50 border-r border-gray-200 transition-all duration-200 ease-in-out flex-shrink-0 sticky top-0",
          isCollapsed ? "w-0 overflow-hidden" : "w-[260px]"
        )}
      >
        <div className="w-[260px] h-full">
          <SidebarContent
            mode="desktop"
            isLoggedIn={isLoggedIn}
            menuItems={menuItems}
            isActive={isActive}
            onCloseMobile={() => setIsMobileOpen(false)}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      {/* Desktop Toggle Button + Hover Zone */}
      <div 
        className={twMerge(
          "hidden lg:block fixed top-0 z-50 transition-all duration-200",
          isCollapsed ? "left-0" : "left-[260px]"
        )}
        onMouseEnter={() => isCollapsed && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Hover-Reveal Floating Sidebar (only when collapsed and hovering) */}
        {isCollapsed && (
          <div
            className={twMerge(
              "absolute top-0 left-0 h-screen w-[260px] bg-gray-50 border-r border-gray-200 shadow-2xl transition-all duration-200 ease-in-out",
              isHovering 
                ? "translate-x-0 opacity-100" 
                : "-translate-x-full opacity-0 pointer-events-none"
            )}
          >
            <SidebarContent
              mode="desktop"
              isLoggedIn={isLoggedIn}
              menuItems={menuItems}
              isActive={isActive}
              onCloseMobile={() => setIsMobileOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        )}

        {/* Toggle Button - positioned at right edge of sidebar area */}
        <div 
          className={twMerge(
            "absolute top-2 transition-all duration-200",
            isHovering ? "left-[268px]" : "left-2"
          )}
        >
          <button
            className="hover:bg-gray-100 rounded-lg p-2 transition-colors bg-white border border-gray-200 shadow-sm"
            onClick={handleToggle}
          >
            <SidebarToggleIcon className="text-gray-500" isCollapsed={isCollapsed && !isHovering} />
          </button>
        </div>
      </div>


      {/* Mobile Sidebar */}
      <aside
        className={twMerge(
          "fixed lg:hidden top-0 left-0 z-40 h-[100dvh] w-[304px] max-w-[88vw] bg-gray-50 border-r border-gray-200 shadow-2xl transition-[transform,opacity] duration-200 ease-out",
          isMobileOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <SidebarContent
          mode="mobile"
          isLoggedIn={isLoggedIn}
          menuItems={menuItems}
          isActive={isActive}
          onCloseMobile={() => setIsMobileOpen(false)}
          onLogout={handleLogout}
        />
        {/* Safe area spacer */}
        <div className="h-4 pb-[max(0px,env(safe-area-inset-bottom))]" />
      </aside>
    </>
  );
}
