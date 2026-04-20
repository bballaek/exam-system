"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

interface QuestionStat {
  questionId: number;
  text: string;
  type: string;
  maxPoints: number;
  totalAnswers: number;
  correctAnswers: number;
  percentage: number;
  avgPointsEarned: number;
  difficulty: "easy" | "medium" | "hard";
}

interface AnalyticsData {
  examTitle: string;
  totalSubmissions: number;
  avgScore: number;
  avgPercentage: number;
  questionAnalytics: QuestionStat[];
}

interface QuestionAnalysisProps {
  examSetId: string;
  isOpen: boolean;
  onClose: () => void;
}

const difficultyConfig = {
  easy: { label: "ง่าย", color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50" },
  medium: { label: "ปานกลาง", color: "bg-yellow-500", textColor: "text-yellow-600", bgColor: "bg-yellow-50" },
  hard: { label: "ยาก", color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" },
};

export default function QuestionAnalysis({ examSetId, isOpen, onClose }: QuestionAnalysisProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && examSetId) {
      fetchAnalytics();
    }
  }, [isOpen, examSetId]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/exam-sets/${examSetId}/analytics`);
      if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel — wider for table data */}
      <div
        className={`relative w-full sm:w-[560px] lg:w-[640px] h-full bg-white flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleClose}
              className="p-1.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Icon name="arrow-left" size="sm" className="text-gray-500" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-gray-900 truncate">
                Question Analysis
              </h2>
              {data && (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {data.examTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden lg:flex"
          >
            <Icon name="close" size="sm" className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Icon name="spinner" size="lg" className="text-indigo-500 mb-3" />
              <span className="text-sm">กำลังโหลด...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Icon name="error" size="lg" className="text-red-400 mb-3" />
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : data ? (
            <>
              {/* Summary Stats */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Overview</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-indigo-600">{data.totalSubmissions}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Students</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{data.avgScore}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Avg Score</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">{data.avgPercentage}%</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Avg %</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 mx-5" />

              {data.totalSubmissions === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                  <Icon name="chart" size="xl" className="mb-3" />
                  <p className="text-sm">No students have taken the exam yet</p>
                </div>
              ) : (
                <>
                  {/* Difficulty Legend */}
                  <div className="px-5 py-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>ระดับความยาก:</span>
                      {Object.entries(difficultyConfig).map(([key, config]) => (
                        <span key={key} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${config.color}`} />
                          {config.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Question List — card style instead of table for better mobile */}
                  <div className="px-5 pb-4 space-y-2">
                    {data.questionAnalytics.map((q, index) => {
                      const config = difficultyConfig[q.difficulty];
                      return (
                        <div
                          key={q.questionId}
                          className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100/80 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-indigo-600 flex-shrink-0">
                                #{index + 1}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                q.type === "CHOICE" ? "bg-blue-100 text-blue-700" :
                                q.type === "SHORT" ? "bg-green-100 text-green-700" :
                                "bg-purple-100 text-purple-700"
                              }`}>
                                {q.type}
                              </span>
                              <p className="text-sm text-gray-700 truncate">
                                {q.text || "No question text"}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${config.bgColor} ${config.textColor}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${config.color}`}
                                style={{ width: `${q.percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium tabular-nums w-10 text-right ${config.textColor}`}>
                              {q.percentage}%
                            </span>
                            <span className="text-[11px] text-gray-400 w-12 text-right">
                              {q.correctAnswers}/{q.totalAnswers}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tips */}
                  {(data.questionAnalytics.filter(q => q.difficulty === "hard").length > 0 ||
                    data.questionAnalytics.filter(q => q.percentage === 100).length > 0 ||
                    data.avgPercentage < 60) && (
                    <>
                      <div className="h-px bg-gray-100 mx-5" />
                      <div className="px-5 py-4">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                            <Icon name="info" size="xs" className="text-amber-500" />
                            Tips
                          </h4>
                          <ul className="text-xs text-amber-700 space-y-1.5">
                            {data.questionAnalytics.filter(q => q.difficulty === "hard").length > 0 && (
                              <li>• มี {data.questionAnalytics.filter(q => q.difficulty === "hard").length} ข้อ ที่นักเรียนส่วนใหญ่ตอบผิด ควรทบทวนเนื้อหา</li>
                            )}
                            {data.questionAnalytics.filter(q => q.percentage === 100).length > 0 && (
                              <li>• มี {data.questionAnalytics.filter(q => q.percentage === 100).length} ข้อ ที่ทุกคนตอบถูก อาจเพิ่มความยากได้</li>
                            )}
                            {data.avgPercentage < 60 && (
                              <li>• คะแนนเฉลี่ยต่ำกว่า 60% อาจต้องปรับปรุงการสอน</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
