"use client";

import { useState, useRef, useEffect } from "react";
import Icon from "@/components/Icon";

interface StatisticsData {
  n: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
  q1: number;
  q2: number;
  q3: number;
}

interface ResearchStatisticsProps {
  statistics: StatisticsData;
  isLoading?: boolean;
  onExportCSV?: () => void;
  onExportStatistics?: () => void;
  onExportResearch?: () => void;
}

// Download icon SVG
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function ResearchStatistics({ 
  statistics, 
  isLoading,
  onExportCSV,
  onExportStatistics,
  onExportResearch,
}: ResearchStatisticsProps) {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number, decimals = 2) => {
    if (isNaN(num) || !isFinite(num)) return "0";
    return num.toFixed(decimals);
  };

  const getSkewnessInterpretation = (value: number) => {
    if (value < -0.5) return { text: "เบ้ซ้าย (คะแนนกระจุกด้านสูง)", color: "text-blue-600" };
    if (value > 0.5) return { text: "เบ้ขวา (คะแนนกระจุกด้านต่ำ)", color: "text-red-600" };
    return { text: "สมมาตร", color: "text-green-600" };
  };

  const getKurtosisInterpretation = (value: number) => {
    if (value < -1) return { text: "แบน (Platykurtic)", color: "text-yellow-600" };
    if (value > 1) return { text: "แหลม (Leptokurtic)", color: "text-purple-600" };
    return { text: "ปกติ (Mesokurtic)", color: "text-green-600" };
  };

  const skewnessInfo = getSkewnessInterpretation(statistics.skewness);
  const kurtosisInfo = getKurtosisInterpretation(statistics.kurtosis);

  const statCards = [
    { label: "จำนวน (N)", value: statistics.n.toString(), icon: "users", color: "bg-gray-50" },
    { label: "ค่าเฉลี่ย (Mean)", value: formatNumber(statistics.mean), icon: "chart", color: "bg-blue-50" },
    { label: "มัธยฐาน (Median)", value: formatNumber(statistics.median), icon: "minus", color: "bg-indigo-50" },
    { label: "ฐานนิยม (Mode)", value: statistics.mode.length > 0 ? statistics.mode.slice(0, 3).join(", ") : "-", icon: "star", color: "bg-purple-50" },
    { label: "ต่ำสุด (Min)", value: formatNumber(statistics.min), icon: "minus", color: "bg-red-50" },
    { label: "สูงสุด (Max)", value: formatNumber(statistics.max), icon: "star", color: "bg-green-50" },
    { label: "พิสัย (Range)", value: formatNumber(statistics.range), icon: "chart", color: "bg-orange-50" },
    { label: "ความแปรปรวน (Variance)", value: formatNumber(statistics.variance), icon: "chart", color: "bg-pink-50" },
    { label: "ส่วนเบี่ยงเบนมาตรฐาน (SD)", value: formatNumber(statistics.standardDeviation), icon: "chart", color: "bg-cyan-50" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="chart" size="sm" className="text-gray-500" />
          สถิติเชิงลึกสำหรับการวิจัย
        </h3>
        
        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-gray-600 bg-card hover:bg-muted transition-colors"
          >
            <DownloadIcon />
            Export
            <Icon name="chevron-down" size="xs" />
          </button>
          
          {showExportDropdown && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-gray-500 uppercase">ส่งออกข้อมูล</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { onExportCSV?.(); setShowExportDropdown(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <Icon name="document" size="sm" className="text-gray-400" />
                  <div>
                    <p className="font-medium">ข้อมูลผลสอบ</p>
                    <p className="text-xs text-gray-400">CSV ข้อมูลนักเรียน</p>
                  </div>
                </button>
                <button
                  onClick={() => { onExportStatistics?.(); setShowExportDropdown(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <Icon name="chart" size="sm" className="text-gray-400" />
                  <div>
                    <p className="font-medium">สถิติ</p>
                    <p className="text-xs text-gray-400">CSV สถิติเชิงพรรณนา</p>
                  </div>
                </button>
                <button
                  onClick={() => { onExportResearch?.(); setShowExportDropdown(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <Icon name="file" size="sm" className="text-gray-400" />
                  <div>
                    <p className="font-medium">รายงานวิจัยฉบับเต็ม</p>
                    <p className="text-xs text-gray-400">CSV สถิติ + ข้อมูลดิบ</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {statCards.map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-lg p-3`}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quartiles */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">Quartiles (ควอไทล์)</p>
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <p className="text-gray-500">Q1 (25%)</p>
              <p className="font-bold text-gray-900">{formatNumber(statistics.q1)}</p>
            </div>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full relative">
              <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
              <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white" />
              <div className="absolute left-3/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />
            </div>
            <div className="text-center">
              <p className="text-gray-500">Q2 (50%)</p>
              <p className="font-bold text-gray-900">{formatNumber(statistics.q2)}</p>
            </div>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full" />
            <div className="text-center">
              <p className="text-gray-500">Q3 (75%)</p>
              <p className="font-bold text-gray-900">{formatNumber(statistics.q3)}</p>
            </div>
          </div>
        </div>

        {/* Skewness & Kurtosis */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">ความเบ้ (Skewness)</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(statistics.skewness)}</p>
            <p className={`text-xs mt-1 ${skewnessInfo.color}`}>{skewnessInfo.text}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">ความโด่ง (Kurtosis)</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(statistics.kurtosis)}</p>
            <p className={`text-xs mt-1 ${kurtosisInfo.color}`}>{kurtosisInfo.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
