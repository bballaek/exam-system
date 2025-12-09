"use client";

import Icon from "@/components/Icon";

interface StatCardProps {
  icon: "users" | "check-circle" | "chart" | "star" | "minus";
  label: string;
  value: string | number;
  color: "indigo" | "green" | "blue" | "yellow" | "red";
}

const colorClasses = {
  indigo: { bg: "bg-indigo-100 text-indigo-600", value: "text-indigo-600" },
  green: { bg: "bg-green-100 text-green-600", value: "text-green-600" },
  blue: { bg: "bg-blue-100 text-blue-600", value: "text-blue-600" },
  yellow: { bg: "bg-yellow-100 text-yellow-600", value: "text-yellow-600" },
  red: { bg: "bg-red-100 text-red-600", value: "text-red-600" },
};

export default function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg}`}>
        <Icon name={icon} size="sm" />
      </div>
      <div>
        <div className={`text-xl font-bold ${colors.value}`}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
