"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Icon from "@/components/Icon";

interface PassFailPieChartProps {
  data: { name: string; value: number }[];
}

const CHART_COLORS = {
  pass: "#22c55e",
  fail: "#ef4444",
};

export default function PassFailPieChart({ data }: PassFailPieChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Icon name="chart" size="sm" className="text-green-600" />
        สัดส่วนผ่าน/ไม่ผ่าน
      </h3>
      <div className="h-64">
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
              <Cell fill={CHART_COLORS.pass} />
              <Cell fill={CHART_COLORS.fail} />
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
