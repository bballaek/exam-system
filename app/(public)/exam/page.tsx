"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type QuestionType = "CHOICE" | "SHORT" | "CODEMSA";

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
  subQuestions?: string[];
}

interface ExamData {
  examTitle: string;
  examId: string;
  questions: Question[];
}

interface StudentInfo {
  firstName: string;
  lastName: string;
  studentId: string;
  studentNumber?: string;
  classroom?: string;
}

const optionLabels = ["ก", "ข", "ค", "ง"];

export default function ExamPage() {
  const router = useRouter();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [isLoadingExam, setIsLoadingExam] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | string[] | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [countdownTitle, setCountdownTitle] = useState("หมดเวลาแล้ว!");
  const totalTime = 60 * 60;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const storedInfo = sessionStorage.getItem("studentInfo");
    if (storedInfo) {
      try {
        setStudentInfo(JSON.parse(storedInfo));
      } catch (e) {
        console.error("Error parsing student info:", e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setIsLoadingExam(true);
        setFetchError(null);
        const response = await fetch("/api/exam");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "ไม่สามารถโหลดข้อสอบได้");
        }
        const data: ExamData = await response.json();
        setExamData(data);
        setUserAnswers(new Array(data.questions.length).fill(null));
      } catch (error) {
        console.error("Error fetching exam:", error);
        setFetchError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อสอบ");
      } finally {
        setIsLoadingExam(false);
      }
    };
    fetchExam();
  }, []);

  const questions = examData?.questions || [];
  const examTitle = examData?.examTitle || "แบบทดสอบออนไลน์";
  const examId = examData?.examId || "";

  const submitExam = useCallback(async () => {
    setShowCountdown(false);
    setShowLoading(true);
    try {
      const payload = {
        examSetId: examId,
        studentInfo: studentInfo || { firstName: "Unknown", lastName: "Student", studentId: "N/A" },
        userAnswers
      };
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "ไม่สามารถส่งคำตอบได้");
      }
      const studentName = studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : "ผู้สอบ";
      sessionStorage.removeItem("studentInfo");
      router.push(`/result?score=${result.score}&totalPoints=${result.totalPoints}&name=${encodeURIComponent(studentName)}`);
    } catch (error) {
      console.error("Submit error:", error);
      setShowLoading(false);
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : "ไม่ทราบสาเหตุ"}`);
      setIsSubmitting(false);
    }
  }, [examId, studentInfo, userAnswers, router]);

  const showAutoSubmitPopup = useCallback((title: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setCountdownTitle(title);
    setShowCountdown(true);
    setCountdownSeconds(5);
  }, [isSubmitting]);

  useEffect(() => {
    if (isSubmitting || isLoadingExam || !examData) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          showAutoSubmitPopup("หมดเวลาแล้ว!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitting, isLoadingExam, examData, showAutoSubmitPopup]);

  useEffect(() => {
    if (!showCountdown) return;
    const countdown = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [showCountdown, submitExam]);

  useEffect(() => {
    if (!examData) return;
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        showAutoSubmitPopup("มีการสลับหน้าจอ!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isSubmitting, showAutoSubmitPopup, examData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    const percentage = (timeLeft / totalTime) * 100;
    if (percentage < 20) return "from-rose-500 to-red-600";
    if (percentage < 50) return "from-amber-400 to-orange-500";
    return "from-emerald-400 to-teal-500";
  };

  const saveAnswer = (answer: string | string[]) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  };

  const handleOptionSelect = (option: string) => {
    if (isSubmitting) return;
    saveAnswer(option);
  };

  const handleShortAnswerChange = (value: string) => {
    if (isSubmitting) return;
    saveAnswer(value);
  };

  const handleMSAChange = (index: number, value: string) => {
    if (isSubmitting) return;
    const currentAnswers = (userAnswers[currentQuestionIndex] as string[]) || [];
    const newAnswers = [...currentAnswers];
    newAnswers[index] = value;
    saveAnswer(newAnswers);
  };

  const goToQuestion = (index: number) => {
    if (isSubmitting) return;
    setCurrentQuestionIndex(index);
  };

  const goNext = () => {
    if (isSubmitting || currentQuestionIndex >= questions.length - 1) return;
    setCurrentQuestionIndex((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const goPrev = () => {
    if (isSubmitting || currentQuestionIndex <= 0) return;
    setCurrentQuestionIndex((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    if (confirm("คุณต้องการส่งคำตอบใช่หรือไม่?")) {
      setIsSubmitting(true);
      submitExam();
    }
  };

  const isAnswered = (index: number) => {
    const answer = userAnswers[index];
    if (answer === null || answer === undefined) return false;
    if (Array.isArray(answer)) return answer.some((a) => a && a.length > 0);
    return answer.length > 0;
  };

  const getQuestionTypeDisplay = (type: QuestionType) => {
    switch (type) {
      case "CODEMSA": return "Coding";
      case "SHORT": return "เติมคำตอบ";
      default: return "ปรนัย";
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const timerPercentage = (timeLeft / totalTime) * 100;
  const answeredCount = userAnswers.filter((a, i) => isAnswered(i)).length;

  // Loading State
  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">กำลังโหลดข้อสอบ</h1>
          <p className="text-slate-400">กรุณารอสักครู่...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500/20 to-red-600/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">เกิดข้อผิดพลาด</h1>
          <p className="text-slate-400 mb-8">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25">
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (!examData || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">ไม่พบข้อสอบ</h1>
          <p className="text-slate-400 mb-8">กรุณาติดต่อผู้ดูแลระบบ</p>
          <button onClick={() => router.push("/")} className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25">
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 select-none" onContextMenu={(e) => e.preventDefault()}>
      {!showCountdown && !showLoading && (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {/* Header Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{examTitle}</h1>
                <p className="text-slate-400 text-sm">ตอบแล้ว {answeredCount} จาก {questions.length} ข้อ</p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${getTimerColor()} shadow-lg`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-2xl font-bold text-white font-mono">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Timer Bar */}
            <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${getTimerColor()} transition-all duration-1000 rounded-full`} style={{ width: `${timerPercentage}%` }} />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Question Navigator */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 lg:sticky lg:top-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">สถานะการตอบ</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square rounded-xl text-sm font-bold transition-all duration-200 ${
                        index === currentQuestionIndex
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-110"
                          : isAnswered(index)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600/30"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30"></span>
                    <span className="text-slate-400">ตอบแล้ว</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm mt-2">
                    <span className="w-4 h-4 rounded bg-slate-700/50 border border-slate-600/30"></span>
                    <span className="text-slate-400">ยังไม่ได้ตอบ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
                {/* Question Header */}
                <div className="px-8 py-5 border-b border-slate-700/50 flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">คำถามที่ {currentQuestionIndex + 1}</span>
                  <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/30">
                    {getQuestionTypeDisplay(currentQuestion.type)}
                  </span>
                </div>

                {/* Question Content */}
                <div className="p-8">
                  {currentQuestion.type === "CODEMSA" ? (
                    <pre className="mb-8 p-6 rounded-2xl bg-slate-900/80 border border-slate-700/50 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {currentQuestion.text}
                    </pre>
                  ) : (
                    <h2 className="text-xl text-white font-medium mb-8 leading-relaxed">
                      {currentQuestion.text}
                    </h2>
                  )}

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion.type === "CHOICE" &&
                      currentQuestion.options?.map((option, index) => {
                        const isSelected = userAnswers[currentQuestionIndex] === option;
                        return (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${
                              isSelected
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-700/30"
                            }`}
                          >
                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                              isSelected
                                ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                                : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600/50"
                            }`}>
                              {optionLabels[index]}
                            </span>
                            <span className={`flex-1 ${isSelected ? "text-white" : "text-slate-300"}`}>{option}</span>
                            {isSelected && (
                              <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        );
                      })}

                    {currentQuestion.type === "SHORT" && (
                      <input
                        type="text"
                        placeholder="พิมพ์คำตอบของคุณ..."
                        value={(userAnswers[currentQuestionIndex] as string) || ""}
                        onChange={(e) => handleShortAnswerChange(e.target.value)}
                        className="w-full p-5 rounded-2xl bg-slate-800/30 border-2 border-slate-700/50 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-all"
                      />
                    )}

                    {currentQuestion.type === "CODEMSA" &&
                      currentQuestion.subQuestions?.map((subQ, index) => {
                        const answers = (userAnswers[currentQuestionIndex] as string[]) || [];
                        return (
                          <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                            <span className="px-4 py-2 rounded-xl bg-slate-700/50 text-white font-mono font-bold text-sm">{subQ}</span>
                            <input
                              type="text"
                              value={answers[index] || ""}
                              onChange={(e) => handleMSAChange(index, e.target.value)}
                              className="flex-1 p-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-all"
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Navigation Footer */}
                <div className="px-8 py-6 border-t border-slate-700/50 flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <button
                    onClick={goPrev}
                    disabled={currentQuestionIndex === 0}
                    className="px-8 py-4 rounded-2xl border border-slate-600/50 text-slate-300 font-semibold hover:bg-slate-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    ย้อนกลับ
                  </button>
                  {!isLastQuestion ? (
                    <button
                      onClick={goNext}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                    >
                      ถัดไป
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ส่งคำตอบ
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <footer className="mt-8 text-center text-sm text-slate-500">
                &copy; {currentYear} Classroom Master
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {showCountdown && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-12 text-center max-w-sm w-full">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500/20 to-red-600/20 flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-rose-400 mb-4">{countdownTitle}</h1>
            <div className="text-7xl font-bold text-white mb-6 font-mono">{countdownSeconds}</div>
            <p className="text-slate-400">กำลังส่งคำตอบอัตโนมัติ...</p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {showLoading && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"></div>
              <div className="absolute inset-4 rounded-full border-4 border-slate-700"></div>
              <div className="absolute inset-4 rounded-full border-4 border-t-blue-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }}></div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">กำลังส่งคำตอบ</h1>
            <p className="text-slate-400">กรุณารอสักครู่...</p>
          </div>
        </div>
      )}
    </div>
  );
}