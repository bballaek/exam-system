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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Icon name="chart" size="sm" className="text-indigo-600" />
              วิเคราะห์รายข้อ
            </h2>
            {data && (
              <p className="text-sm text-gray-500 mt-1">{data.examTitle}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <Icon name="close" size="sm" className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="spinner" size="lg" className="text-indigo-600" />
              <span className="ml-3 text-gray-500">กำลังโหลด...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Icon name="error" size="lg" className="mx-auto text-red-500 mb-3" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
              >
                ลองใหม่
              </button>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{data.totalSubmissions}</p>
                  <p className="text-sm text-gray-600">ผู้เข้าสอบ</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{data.avgScore}</p>
                  <p className="text-sm text-gray-600">คะแนนเฉลี่ย</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{data.avgPercentage}%</p>
                  <p className="text-sm text-gray-600">เฉลี่ย %</p>
                </div>
              </div>

              {/* Empty state */}
              {data.totalSubmissions === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Icon name="chart" size="xl" className="mx-auto mb-3" />
                  <p>ยังไม่มีผู้สอบ ไม่สามารถวิเคราะห์ได้</p>
                </div>
              ) : (
                <>
                  {/* Difficulty Legend */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">ระดับความยาก:</span>
                    {Object.entries(difficultyConfig).map(([key, config]) => (
                      <span key={key} className="flex items-center gap-1">
                        <span className={`w-3 h-3 rounded-full ${config.color}`} />
                        {config.label}
                      </span>
                    ))}
                  </div>

                  {/* Question Statistics Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">ข้อ</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">คำถาม</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-20">ประเภท</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-28">ตอบถูก</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-48">% ความถูกต้อง</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-20">ระดับ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.questionAnalytics.map((q, index) => {
                          const config = difficultyConfig[q.difficulty];
                          return (
                            <tr key={q.questionId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-[300px] truncate">
                                {q.text || "ไม่มีข้อความ"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  q.type === "CHOICE" ? "bg-blue-100 text-blue-700" :
                                  q.type === "SHORT" ? "bg-green-100 text-green-700" :
                                  "bg-purple-100 text-purple-700"
                                }`}>
                                  {q.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-600">
                                {q.correctAnswers}/{q.totalAnswers}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-300 ${config.color}`}
                                      style={{ width: `${q.percentage}%` }}
                                    />
                                  </div>
                                  <span className={`text-sm font-medium ${config.textColor} w-12 text-right`}>
                                    {q.percentage}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${config.bgColor} ${config.textColor}`}>
                                  {config.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Tips */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                      <Icon name="info" size="sm" />
                      ข้อเสนอแนะ
                    </h4>
                    <ul className="text-sm text-amber-700 space-y-1">
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
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
