"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Icon from "@/components/Icon";

function ResultContent() {
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get("score") || "0", 10);
  const totalPoints = parseInt(searchParams.get("totalPoints") || "100", 10);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className={`${gradeInfo.bgColor} px-6 py-5 text-center text-white`}>
            <h1 className="flex items-center justify-center gap-2 text-lg font-bold">
              <Icon name="check-circle" size="md" />
              ส่งคำตอบเรียบร้อย
            </h1>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Success Icon */}
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${gradeInfo.bgColor}`}>
              <Icon name="check-circle" size="xl" className="text-white" />
            </div>

            <p className="mb-3 text-base text-gray-500">
              คะแนนที่คุณทำได้
            </p>

            {/* Score Display */}
            <div className="mb-4">
              <span className={`text-5xl font-bold ${gradeInfo.color}`}>
                {score}
              </span>
              <span className="text-xl text-gray-400">
                {" "}/ {totalPoints}
              </span>
            </div>

            {/* Percentage Badge */}
            <div className="mb-6">
              <span className={`inline-flex items-center gap-2 rounded-full ${gradeInfo.bgColor} px-4 py-2 text-base font-bold text-white`}>
                <Icon name="chart" size="sm" />
                {percentage}% - {gradeInfo.grade}
              </span>
            </div>

            {/* Thank you message */}
            <p className="text-sm text-gray-400 mb-6">
              ขอบคุณที่ทำแบบทดสอบ
            </p>

            {/* Action Button */}
            <Link
              href="/"
              className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-base font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
            >
              <Icon name="home" size="sm" />
              กลับหน้าแรก
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          © {currentYear} Classroom Master
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Icon name="spinner" size="lg" className="text-indigo-600" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
