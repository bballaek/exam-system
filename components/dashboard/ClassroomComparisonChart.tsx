"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Icon from "@/components/Icon";

interface ClassroomData {
  classroom: string;
  avgScore: number;
  count: number;
  passRate: number;
}

interface ClassroomComparisonChartProps {
  data: ClassroomData[];
  overallAvg?: number;
}

const COLORS = ["#6366f1", "#f97316", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// Lazy load the chart
const ChartContent = dynamic(
  () => import("recharts").then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend } = mod;
    
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const d = payload[0].payload as ClassroomData;
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium text-gray-900">Classroom {label}</p>
            <p className="text-sm text-gray-600">Average Score: <span className="font-bold">{d.avgScore.toFixed(1)}%</span></p>
            <p className="text-sm text-gray-600">Number of Students: <span className="font-bold">{d.count} คน</span></p>
            <p className="text-sm text-gray-600">Pass Rate: <span className="font-bold">{d.passRate.toFixed(0)}%</span></p>
          </div>
        );
      }
      return null;
    };

    return ({ data, overallAvg }: { data: ClassroomData[]; overallAvg?: number }) => (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="classroom" 
            tick={{ fontSize: 12, fill: "#6b7280" }} 
            axisLine={{ stroke: "#e5e7eb" }}
            tickFormatter={(value) => `Classroom ${value}`}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#6b7280" }} 
            axisLine={{ stroke: "#e5e7eb" }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          {overallAvg !== undefined && (
            <ReferenceLine 
              y={overallAvg} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ value: `Overall Average ${overallAvg.toFixed(1)}%`, fill: '#ef4444', fontSize: 11, position: 'right' }}
            />
          )}
          <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
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

function ClassroomComparisonChart({ data, overallAvg }: ClassroomComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Icon name="chart" size="sm" className="text-gray-500" />
          Compare Average Score by Classroom
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Icon name="chart" size="lg" className="mx-auto mb-2" />
            <p>No classroom data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Icon name="chart" size="sm" className="text-gray-500" />
        Compare Average Score by Classroom
      </h3>
      <div className="h-64">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Loading chart...
          </div>
        }>
          <ChartContent data={data} overallAvg={overallAvg} />
        </Suspense>
      </div>

      {/* Summary Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-2 text-left text-gray-500 font-medium">Classroom</th>
              <th className="py-2 text-center text-gray-500 font-medium">Number of Students</th>
              <th className="py-2 text-center text-gray-500 font-medium">Average Score</th>
              <th className="py-2 text-center text-gray-500 font-medium">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.classroom} className="border-b border-gray-50">
                <td className="py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  ห้อง {d.classroom}
                </td>
                <td className="py-2 text-center">{d.count} คน</td>
                <td className="py-2 text-center font-medium">{d.avgScore.toFixed(1)}%</td>
                <td className="py-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded ${d.passRate >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {d.passRate.toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default React.memo(ClassroomComparisonChart);
