"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Icon from "@/components/Icon";

function ResultContent() {
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get("score") || "0", 10);
  const totalPoints = parseInt(searchParams.get("totalPoints") || "100", 10);
  const studentName = searchParams.get("name") || "ผู้สอบ";
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  const getGradeInfo = () => {
    if (percentage >= 80) return { grade: "ดีเยี่ยม", color: "text-green-600", bgColor: "bg-green-500" };
    if (percentage >= 60) return { grade: "ผ่าน", color: "text-blue-600", bgColor: "bg-blue-500" };
    if (percentage >= 40) return { grade: "พอใช้", color: "text-yellow-600", bgColor: "bg-yellow-500" };
    return { grade: "ไม่ผ่าน", color: "text-red-600", bgColor: "bg-red-500" };
  };

  const gradeInfo = getGradeInfo();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-muted flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${gradeInfo.bgColor} flex items-center justify-center`}>
              <Icon name="check-circle" size="sm" className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">ส่งคำตอบเรียบร้อย</h2>
              <p className="text-sm text-gray-500">ผลการสอบของคุณ</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Student Info */}
            <div className="mb-6 p-4 rounded-xl border border-border bg-muted">
              <div className="text-xs text-gray-500 font-medium mb-1">ผู้สอบ</div>
              <div className="text-lg font-bold text-gray-900">{studentName}</div>
            </div>

            {/* Score Display */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <span className={`text-5xl font-bold ${gradeInfo.color}`}>{score}</span>
                <span className="text-2xl text-gray-400"> / {totalPoints}</span>
              </div>
              <div className="text-sm text-gray-500">คะแนนที่ได้</div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                <span>ความสำเร็จ</span>
                <span>{percentage}%</span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                <div className={`h-full ${gradeInfo.bgColor} rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
              </div>
            </div>

            {/* Grade Badge */}
            <div className="flex justify-center mb-6">
              <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white ${gradeInfo.bgColor}`}>
                <Icon name="chart" size="sm" />
                {gradeInfo.grade}
              </span>
            </div>

            {/* Divider */}
            <div className="pt-4 border-t border-border">
              <p className="text-center text-sm text-gray-400 mb-4">ขอบคุณที่ทำแบบทดสอบ</p>
              
              {/* Action Button */}
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Icon name="home" size="sm" />
                กลับหน้าแรก
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          © {currentYear} MasterExam
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Icon name="spinner" size="lg" className="text-gray-600" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
