"use client";

import Icon from "@/components/Icon";

interface BoxPlotData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}

interface BoxPlotChartProps {
  data: BoxPlotData;
  title?: string;
}

export default function BoxPlotChart({ data, title = "Box Plot (คะแนน %)" }: BoxPlotChartProps) {
  // Normalize values to percentages for display (0-100 scale)
  const scale = (value: number, min: number, max: number) => {
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 100;
  };

  const displayMin = Math.max(0, data.min - 5);
  const displayMax = Math.min(100, data.max + 5);

  const minPos = scale(data.min, displayMin, displayMax);
  const q1Pos = scale(data.q1, displayMin, displayMax);
  const medianPos = scale(data.median, displayMin, displayMax);
  const q3Pos = scale(data.q3, displayMin, displayMax);
  const maxPos = scale(data.max, displayMin, displayMax);
  const meanPos = scale(data.mean, displayMin, displayMax);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Icon name="chart" size="sm" className="text-gray-500" />
        {title}
      </h3>
      
      {/* Box Plot Container */}
      <div className="relative h-32 my-6">
        {/* Scale labels */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-400 mb-2">
          <span>{displayMin.toFixed(0)}%</span>
          <span>{displayMax.toFixed(0)}%</span>
        </div>

        {/* Box Plot SVG */}
        <div className="absolute top-8 left-0 right-0 h-16">
          <svg width="100%" height="100%" className="overflow-visible">
            {/* Min-Q1 Whisker */}
            <line
              x1={`${minPos}%`}
              y1="50%"
              x2={`${q1Pos}%`}
              y2="50%"
              stroke="#9ca3af"
              strokeWidth="2"
            />
            {/* Min cap */}
            <line
              x1={`${minPos}%`}
              y1="35%"
              x2={`${minPos}%`}
              y2="65%"
              stroke="#9ca3af"
              strokeWidth="2"
            />

            {/* Box (Q1 to Q3) */}
            <rect
              x={`${q1Pos}%`}
              y="20%"
              width={`${q3Pos - q1Pos}%`}
              height="60%"
              fill="#e0e7ff"
              stroke="#6366f1"
              strokeWidth="2"
              rx="4"
            />

            {/* Median line */}
            <line
              x1={`${medianPos}%`}
              y1="20%"
              x2={`${medianPos}%`}
              y2="80%"
              stroke="#4f46e5"
              strokeWidth="3"
            />

            {/* Mean marker (diamond) */}
            <polygon
              points={`${meanPos},30 ${parseFloat(String(meanPos)) + 1.5},50 ${meanPos},70 ${parseFloat(String(meanPos)) - 1.5},50`}
              fill="#f97316"
              transform={`translate(0, 0)`}
              style={{ transformOrigin: `${meanPos}% 50%` }}
            />

            {/* Q3-Max Whisker */}
            <line
              x1={`${q3Pos}%`}
              y1="50%"
              x2={`${maxPos}%`}
              y2="50%"
              stroke="#9ca3af"
              strokeWidth="2"
            />
            {/* Max cap */}
            <line
              x1={`${maxPos}%`}
              y1="35%"
              x2={`${maxPos}%`}
              y2="65%"
              stroke="#9ca3af"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 mt-2">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-indigo-200 border border-indigo-500 rounded" />
          <span>IQR (Q1-Q3)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-indigo-700" />
          <span>Median</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-500 rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          <span>Mean</span>
        </div>
      </div>

      {/* Values Table */}
      <div className="grid grid-cols-6 gap-2 mt-4 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Min</p>
          <p className="text-sm font-bold text-gray-700">{data.min.toFixed(1)}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Q1</p>
          <p className="text-sm font-bold text-indigo-600">{data.q1.toFixed(1)}</p>
        </div>
        <div className="bg-indigo-100 rounded-lg p-2">
          <p className="text-xs text-gray-400">Median</p>
          <p className="text-sm font-bold text-indigo-700">{data.median.toFixed(1)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Mean</p>
          <p className="text-sm font-bold text-orange-600">{data.mean.toFixed(1)}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Q3</p>
          <p className="text-sm font-bold text-indigo-600">{data.q3.toFixed(1)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Max</p>
          <p className="text-sm font-bold text-gray-700">{data.max.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}
