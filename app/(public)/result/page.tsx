"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Icon from "@/components/Icon";

function ResultContent() {
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get("score") || "0", 10);
  const totalPoints = parseInt(searchParams.get("totalPoints") || "100", 10);
  const studentName = searchParams.get("name") || "ผู้สอบ";
  const examId = searchParams.get("examId") || "";
  const examTitle = searchParams.get("examTitle") || "แบบทดสอบ";
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const getGradeInfo = () => {
    if (percentage >= 80) return { grade: "ดีเยี่ยม", color: "text-green-600", bgColor: "bg-green-500" };
    if (percentage >= 60) return { grade: "ผ่าน", color: "text-blue-600", bgColor: "bg-blue-500" };
    if (percentage >= 40) return { grade: "พอใช้", color: "text-yellow-600", bgColor: "bg-yellow-500" };
    return { grade: "ไม่ผ่าน", color: "text-red-600", bgColor: "bg-red-500" };
  };

  const gradeInfo = getGradeInfo();
  const currentYear = new Date().getFullYear();

  const handleSendEmail = async () => {
    if (!email.trim() || !email.includes("@")) {
      alert("กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-result-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          studentName,
          examTitle,
          score,
          totalPoints,
          percentage,
          grade: gradeInfo.grade,
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
          setEmail("");
        }, 2000);
      } else {
        alert("ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSending(false);
    }
  };

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
              
              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Send Email Button */}
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Icon name="share" size="sm" />
                  ส่งผลสอบทางอีเมล
                </button>

                {/* Retry Button */}
                {examId && (
                  <Link
                    href={`/exam/${examId}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Icon name="refresh" size="sm" />
                    สอบอีกครั้ง
                  </Link>
                )}

                {/* Home Button */}
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
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          © {currentYear} MasterExam
        </p>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon name="share" size="sm" className="text-indigo-600" />
                ส่งผลสอบทางอีเมล
              </h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {emailSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="check-circle" size="lg" className="text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">ส่งเรียบร้อย!</p>
                  <p className="text-sm text-gray-500 mt-1">ผลสอบถูกส่งไปที่ {email}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    กรอกอีเมลเพื่อรับผลสอบ
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </>
              )}
            </div>

            {/* Footer */}
            {!emailSent && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending || !email.trim()}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Icon name="spinner" size="sm" />
                      กำลังส่ง...
                    </>
                  ) : (
                    "ส่งอีเมล"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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

