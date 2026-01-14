"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Icon from "@/components/Icon";

function ResultContent() {
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get("score") || "0", 10);
  const totalPoints = parseInt(searchParams.get("totalPoints") || "100", 10);
  const studentName = searchParams.get("name") || "Student";
  const examId = searchParams.get("examId") || "";
  const examTitle = searchParams.get("examTitle") || "Exam";
  const timeRemaining = searchParams.get("timeRemaining") || ""; // Format: "00:05:15" or seconds
  const examDate = searchParams.get("examDate") || new Date().toISOString();
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const getGradeInfo = () => {
    if (percentage >= 80) return { grade: "Excellent", color: "text-green-600", bgColor: "bg-green-500" };
    if (percentage >= 60) return { grade: "Pass", color: "text-blue-600", bgColor: "bg-blue-500" };
    if (percentage >= 40) return { grade: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-500" };
    return { grade: "Fail", color: "text-red-600", bgColor: "bg-red-500" };
  };

  // Format time remaining
  const formatTimeRemaining = (time: string) => {
    if (!time) return null;
    // If it's already formatted as HH:MM:SS
    if (time.includes(":")) return time;
    // If it's seconds, convert to HH:MM:SS
    const seconds = parseInt(time, 10);
    if (isNaN(seconds)) return null;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format exam date
  const formatExamDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formattedTime = formatTimeRemaining(timeRemaining);
  const formattedDate = formatExamDate(examDate);

  const gradeInfo = getGradeInfo();
  const currentYear = new Date().getFullYear();

  const handleSendEmail = async () => {
    if (!email.trim() || !email.includes("@")) {
      alert("Please enter a valid email address");
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
        alert("Failed to send email. Please try again.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("An error occurred. Please try again.");
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
              <h2 className="text-xl font-bold text-gray-900">Submitted Successfully</h2>
              <p className="text-sm text-gray-500">Your exam results</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Exam Info Bar */}
            <div className="mb-6 p-4 rounded-xl border border-border bg-gray-50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Exam Date */}
                <div>
                  <div className="text-xs text-gray-500 font-medium">You started this exam:</div>
                  <div className="text-sm font-semibold text-gray-800">{formattedDate}</div>
                </div>
                
                {/* Time Remaining */}
                {formattedTime && (
                  <div className="flex items-center gap-2">
                    <Icon name="clock" size="sm" className="text-gray-400" />
                    <span className="text-sm text-gray-500">Time left:</span>
                    <div className="flex items-center gap-1">
                      {formattedTime.split(":").map((unit, idx) => (
                        <span key={idx} className="flex items-center">
                          <span className="px-2 py-1 bg-gray-900 text-white text-sm font-mono rounded">
                            {unit}
                          </span>
                          {idx < 2 && <span className="text-gray-400 mx-0.5">:</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Student Info */}
            <div className="mb-6 p-4 rounded-xl border border-border bg-muted">
              <div className="text-xs text-gray-500 font-medium mb-1">Student</div>
              <div className="text-lg font-bold text-gray-900">{studentName}</div>
            </div>

            {/* Score Display */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <span className={`text-5xl font-bold ${gradeInfo.color}`}>{score}</span>
                <span className="text-2xl text-gray-400"> / {totalPoints}</span>
              </div>
              <div className="text-sm text-gray-500">Score</div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Progress</span>
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
              <p className="text-center text-sm text-gray-400 mb-4">Thank you for taking the exam</p>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Send Email Button - Hidden for now */}
                {/* <button
                  onClick={() => setShowEmailModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Icon name="share" size="sm" />
                  ส่งผลสอบทางอีเมล
                </button> */}

                {/* Retry Button */}
                {examId && (
                  <Link
                    href={`/exam/${examId}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Icon name="refresh" size="sm" />
                    Retake Exam
                  </Link>
                )}

                {/* Home Button */}
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Icon name="home" size="sm" />
                    Back to Home
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

