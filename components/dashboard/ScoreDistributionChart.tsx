"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Icon from "@/components/Icon";

interface ScoreDistributionChartProps {
  data: { range: string; count: number }[];
}

const CHART_COLOR = "#6366f1";

export default function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Icon name="chart" size="sm" className="text-indigo-600" />
        การกระจายคะแนน
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 10, fill: "#6b7280" }} 
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#6b7280" }} 
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #e5e7eb",
                borderRadius: "8px"
              }} 
            />
            <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
