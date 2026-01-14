"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Icon from "@/components/Icon";

interface PassFailPieChartProps {
  data: { name: string; value: number }[];
}

// Lazy load the entire chart component
const ChartContent = dynamic(
  () => import("recharts").then((mod) => {
    const { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } = mod;
    return ({ data }: { data: { name: string; value: number }[] }) => (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            <Cell fill="#22c55e" />
            <Cell fill="#ef4444" />
          </Pie>
          <Legend 
            wrapperStyle={{ fontSize: "12px" }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "white", 
              border: "1px solid #e5e7eb",
              borderRadius: "8px"
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Loading chart...
      </div>
    )
  }
);

function PassFailPieChart({ data }: PassFailPieChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Icon name="chart" size="sm" className="text-green-600" />
        Pass/Fail Ratio
      </h3>
      <div className="h-64">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Loading chart...
          </div>
        }>
          <ChartContent data={data} />
        </Suspense>
      </div>
    </div>
  );
}

export default React.memo(PassFailPieChart);
