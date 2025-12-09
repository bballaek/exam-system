"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// Question types from API
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
  
  // Data fetching states
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [isLoadingExam, setIsLoadingExam] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Student info from sessionStorage
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  
  // Exam states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | string[] | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [countdownTitle, setCountdownTitle] = useState("หมดเวลาแล้ว!");

  const totalTime = 60 * 60; // Total time for percentage calculation
  const currentYear = new Date().getFullYear();

  // Retrieve student info from sessionStorage on mount
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

  // Fetch exam data on mount
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

  // Get questions array
  const questions = examData?.questions || [];
  const examTitle = examData?.examTitle || "แบบทดสอบออนไลน์";
  const examId = examData?.examId || "";

  // Submit exam function - calls /api/submit
  const submitExam = useCallback(async () => {
    setShowCountdown(false);
    setShowLoading(true);

    try {
      // Prepare payload
      const payload = {
        examSetId: examId,
        studentInfo: studentInfo || {
          firstName: "Unknown",
          lastName: "Student",
          studentId: "N/A"
        },
        userAnswers
      };

      console.log("Submitting to API:", payload);

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "ไม่สามารถส่งคำตอบได้");
      }

      // Success - navigate to results page
      console.log("Submit success:", result);
      
      // Clear student info from sessionStorage
      sessionStorage.removeItem("studentInfo");
      
      // Navigate to results
      router.push(`/result?score=${result.score}&totalPoints=${result.totalPoints}`);
      
    } catch (error) {
      console.error("Submit error:", error);
      setShowLoading(false);
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : "ไม่ทราบสาเหตุ"}`);
      setIsSubmitting(false);
    }
  }, [examId, studentInfo, userAnswers, router]);

  // Auto submit with countdown
  const showAutoSubmitPopup = useCallback((title: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setCountdownTitle(title);
    setShowCountdown(true);
    setCountdownSeconds(5);
  }, [isSubmitting]);

  // Timer effect - only start when exam is loaded
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

  // Countdown effect
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

  // Visibility change detection - only when exam is loaded
  useEffect(() => {
    if (!examData) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        showAutoSubmitPopup("มีการสลับหน้าจอ!");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSubmitting, showAutoSubmitPopup, examData]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get timer bar color
  const getTimerBarColor = () => {
    const percentage = (timeLeft / totalTime) * 100;
    if (percentage < 20) return "bg-red-500";
    if (percentage < 50) return "bg-orange-400";
    return "bg-green-500";
  };

  // Save answer for current question
  const saveAnswer = (answer: string | string[]) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  };

  // Handle option selection (multiple choice)
  const handleOptionSelect = (option: string) => {
    if (isSubmitting) return;
    saveAnswer(option);
  };

  // Handle short answer input
  const handleShortAnswerChange = (value: string) => {
    if (isSubmitting) return;
    saveAnswer(value);
  };

  // Handle MSA input
  const handleMSAChange = (index: number, value: string) => {
    if (isSubmitting) return;
    const currentAnswers = (userAnswers[currentQuestionIndex] as string[]) || [];
    const newAnswers = [...currentAnswers];
    newAnswers[index] = value;
    saveAnswer(newAnswers);
  };

  // Navigation
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

  // Check if answer exists
  const isAnswered = (index: number) => {
    const answer = userAnswers[index];
    if (answer === null || answer === undefined) return false;
    if (Array.isArray(answer)) return answer.some((a) => a && a.length > 0);
    return answer.length > 0;
  };

  // Get question type display
  const getQuestionTypeDisplay = (type: QuestionType) => {
    switch (type) {
      case "CODEMSA":
        return "Coding";
      case "SHORT":
        return "เติมคำตอบ";
      default:
        return "ปรนัย";
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const timerPercentage = (timeLeft / totalTime) * 100;

  // Loading State
  if (isLoadingExam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-5 font-[family-name:var(--font-sarabun)] text-gray-600">
        <div className="mb-5 h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
        <h1 className="text-xl font-bold text-gray-800">กำลังโหลดข้อสอบ...</h1>
        <p className="mt-2 text-gray-500">กรุณารอสักครู่</p>
      </div>
    );
  }

  // Error State
  if (fetchError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-5 font-[family-name:var(--font-sarabun)] text-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mb-5 h-16 w-16 text-red-500"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <h1 className="mb-2 text-xl font-bold text-gray-800">⚠️ เกิดข้อผิดพลาด</h1>
        <p className="mb-5 text-gray-500">{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-gray-800 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-900"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  // No questions state
  if (!examData || questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-5 font-[family-name:var(--font-sarabun)] text-gray-600">
        <h1 className="mb-2 text-xl font-bold text-gray-800">⚠️ ไม่พบข้อสอบ</h1>
        <p className="mb-5 text-gray-500">กรุณาติดต่อผู้ดูแลระบบ</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-md bg-gray-800 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-900"
        >
          กลับหน้าแรก
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen select-none bg-gray-50 p-5 font-[family-name:var(--font-sarabun)] leading-relaxed text-gray-600"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Main Container */}
      {!showCountdown && !showLoading && (
        <div id="mainContainer">
          <div className="mx-auto max-w-[900px] border border-gray-200 bg-white shadow-lg">
            {/* Header */}
            <div className="bg-gray-800 px-8 py-5 text-white">
              <div className="mb-4 text-center text-xl font-bold">{examTitle}</div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="mb-2 text-center text-lg font-medium">
                  เวลาคงเหลือ: {formatTime(timeLeft)}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all duration-1000 ${getTimerBarColor()}`}
                    style={{ width: `${timerPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Progress Navigation */}
            <div className="border-b border-gray-200 bg-gray-50 px-8 py-5">
              <h3 className="mb-4 text-center text-base font-bold text-gray-600">
                สถานะการตอบ
              </h3>
              <div className="flex flex-wrap justify-center gap-2.5">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm font-bold transition-all
                      ${isAnswered(index) ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}
                      ${index === currentQuestionIndex ? "scale-110 border-2 border-gray-800 text-gray-900" : "border-2 border-transparent"}
                    `}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Question Info */}
              <div className="mb-6 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <span>
                  คำถามที่ {currentQuestionIndex + 1} จาก {questions.length}
                </span>
                <span className="rounded bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600">
                  {getQuestionTypeDisplay(currentQuestion.type)}
                </span>
              </div>

              {/* Question Container */}
              <div>
                {/* Question Text or Code Block */}
                {currentQuestion.type === "CODEMSA" ? (
                  <pre className="mb-5 whitespace-pre-wrap rounded-md bg-gray-900 p-5 font-mono text-sm text-gray-200">
                    {currentQuestion.text}
                  </pre>
                ) : (
                  <div className="mb-5 border-b-2 border-gray-200 pb-4 text-lg font-bold text-gray-900">
                    ข้อ {currentQuestionIndex + 1}. {currentQuestion.text}
                  </div>
                )}

                {/* Options / Inputs */}
                <ul className="list-none space-y-3 p-0">
                  {currentQuestion.type === "CHOICE" &&
                    currentQuestion.options?.map((option, index) => {
                      const isSelected = userAnswers[currentQuestionIndex] === option;
                      return (
                        <li key={index}>
                          <div
                            onClick={() => handleOptionSelect(option)}
                            className={`flex cursor-pointer items-start rounded-md border-2 bg-white px-4 py-3.5 transition-all
                              ${isSelected ? "border-gray-800 bg-gray-100" : "border-gray-200 hover:border-gray-800 hover:bg-gray-50"}
                            `}
                          >
                            <div
                              className={`mr-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold
                                ${isSelected ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-500"}
                              `}
                            >
                              {optionLabels[index]}
                            </div>
                            <span className="flex-1 text-base">{option}</span>
                          </div>
                        </li>
                      );
                    })}

                  {currentQuestion.type === "SHORT" && (
                    <li>
                      <input
                        type="text"
                        placeholder="พิมพ์คำตอบ..."
                        value={(userAnswers[currentQuestionIndex] as string) || ""}
                        onChange={(e) => handleShortAnswerChange(e.target.value)}
                        className="w-full rounded-md border-2 border-gray-200 px-3 py-3 font-[family-name:var(--font-sarabun)] text-base transition-colors focus:border-gray-800 focus:outline-none"
                      />
                    </li>
                  )}

                  {currentQuestion.type === "CODEMSA" &&
                    currentQuestion.subQuestions?.map((subQ, index) => {
                      const answers = (userAnswers[currentQuestionIndex] as string[]) || [];
                      return (
                        <li key={index} className="flex items-center gap-4">
                          <label className="min-w-[80px] font-bold text-gray-800">
                            {subQ}
                          </label>
                          <input
                            type="text"
                            value={answers[index] || ""}
                            onChange={(e) => handleMSAChange(index, e.target.value)}
                            className="flex-1 rounded-md border-2 border-gray-200 px-3 py-3 font-[family-name:var(--font-sarabun)] text-base transition-colors focus:border-gray-800 focus:outline-none"
                          />
                        </li>
                      );
                    })}
                </ul>
              </div>

              {/* Navigation Buttons */}
              <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 md:flex-row md:justify-center">
                <button
                  onClick={goPrev}
                  disabled={currentQuestionIndex === 0}
                  className="rounded-md border-2 border-gray-400 bg-white px-7 py-3 font-[family-name:var(--font-sarabun)] text-base font-medium text-gray-500 transition-colors hover:bg-gray-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white"
                >
                  ย้อนกลับ
                </button>

                {!isLastQuestion ? (
                  <button
                    onClick={goNext}
                    className="rounded-md border-2 border-gray-800 bg-white px-7 py-3 font-[family-name:var(--font-sarabun)] text-base font-medium text-gray-800 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    ถัดไป
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="rounded-md border-2 border-gray-800 bg-white px-7 py-3 font-[family-name:var(--font-sarabun)] text-base font-medium text-gray-800 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    ส่งคำตอบ
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-gray-400">
            &copy; {currentYear} Classroom Master Aekkarat Wongchalee
          </footer>
        </div>
      )}

      {/* Countdown Overlay */}
      {showCountdown && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-10 text-center">
          <h1 className="mb-4 text-xl font-bold text-red-700">{countdownTitle}</h1>
          <div className="mb-5 text-5xl font-bold text-red-500">{countdownSeconds}</div>
          <p className="text-base text-gray-500">กำลังส่งคำตอบอัตโนมัติ...</p>
        </div>
      )}

      {/* Loading Overlay */}
      {showLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-10 text-center">
          <div className="mb-5 h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
          <h1 className="text-2xl font-bold text-gray-800">กำลังส่งคำตอบ...</h1>
          <p className="mt-2 text-gray-500">กรุณารอสักครู่</p>
        </div>
      )}
    </div>
  );
}
