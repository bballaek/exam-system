"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/Icon";

interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}

export default function LogoutButton({ className = "", showText = true }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors ${className}`}
      title="Logout"
    >
      <Icon name="arrow-left" size="sm" />
      {showText && <span>Logout</span>}
    </button>
  );
}
