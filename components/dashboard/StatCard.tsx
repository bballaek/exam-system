"use client";

import Icon from "@/components/Icon";

interface StatCardProps {
  icon: "users" | "check-circle" | "chart" | "star" | "minus";
  label: string;
  value: string | number;
  color: "indigo" | "green" | "blue" | "yellow" | "red";
}

export default function StatCard({ 
  icon, 
  label, 
  value, 
}: StatCardProps) {
  return (
    <div className="flex-1 min-w-0 space-y-2 px-4 sm:px-6 py-4 sm:py-2">
      {/* Header with Icon and Label */}
      <div className="flex items-center gap-1.5">
        <Icon name={icon} size="sm" className="w-[18px] h-[18px] text-gray-500" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>

      {/* Main Value */}
      <p className="text-4xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
