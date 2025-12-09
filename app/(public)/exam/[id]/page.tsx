"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";

// Types
type QuestionType = "CHOICE" | "SHORT" | "CODEMSA";

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  points: number;
  options: string[];
  subQuestions: string[];
}

interface ExamSet {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  questions: Question[];
  // Scheduling fields
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  timeLimitMinutes?: number | null;
  shuffleQuestions?: boolean;
}

interface StudentInfo {
  firstName: string;
  lastName: string;
  studentId: string;
  studentNumber?: string;
  classroom?: string;
}

type Step = "instructions" | "info" | "exam";
const optionLabels = ["ก", "ข", "ค", "ง", "จ", "ฉ"];
const DEFAULT_EXAM_TIME = 60 * 60; // 60 minutes (fallback)
const MAX_TAB_SWITCHES = 3;

// Shared container style for consistency
const containerClass = "min-h-screen bg-gray-50 flex items-center justify-center p-4";
const cardClass = "w-full max-w-2xl bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden";

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function PublicExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  // States
  const [examSet, setExamSet] = useState<ExamSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("instructions");
  
  // Student info
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    firstName: "",
    lastName: "",
    studentId: "",
    studentNumber: "",
    classroom: "",
  });

  // Exam states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | string[] | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // null = unlimited
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Anti-cheat
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  // Shuffled questions (for display)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  // Calculate exam time from database or default
  const examTimeSeconds = examSet?.timeLimitMinutes 
    ? examSet.timeLimitMinutes * 60 
    : null; // null means unlimited

  // Fetch exam set
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/exam-sets/${examId}`);
        if (!response.ok) throw new Error("ไม่พบชุดข้อสอบ");
        const data = await response.json();
        setExamSet(data);
        setUserAnswers(new Array(data.questions.length).fill(null));
        // Initialize shuffled questions
        if (data.shuffleQuestions) {
          setShuffledQuestions(shuffleArray(data.questions));
        } else {
          setShuffledQuestions(data.questions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setIsLoading(false);
      }
    };
    if (examId) fetchExam();
  }, [examId]);

  // Tab switch detection
  useEffect(() => {
    if (step !== "exam" || isSubmitting) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          setShowWarning(true);
          if (newCount >= MAX_TAB_SWITCHES) {
            alert(`คุณสลับหน้าจอเกิน ${MAX_TAB_SWITCHES} ครั้ง ระบบจะส่งคำตอบอัตโนมัติ`);
            handleSubmit();
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [step, isSubmitting]);

  // Timer - only runs if there's a time limit
  useEffect(() => {
    if (step !== "exam" || isSubmitting || examTimeSeconds === null) return;
    
    // Initialize timer when entering exam
    if (timeLeft === null) {
      setTimeLeft(examTimeSeconds);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev: number | null) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, isSubmitting, examTimeSeconds, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const getTimerColor = () => {
    if (!timeLeft || !examTimeSeconds) return "bg-green-500";
    const pct = (timeLeft / examTimeSeconds) * 100;
    if (pct < 20) return "bg-red-500";
    if (pct < 50) return "bg-orange-400";
    return "bg-green-500";
  };

  // Handlers
  const handleContinueToInfo = () => setStep("info");
  
  const handleStartExam = () => {
    if (!studentInfo.firstName.trim() || !studentInfo.lastName.trim() || !studentInfo.studentId.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    sessionStorage.setItem("studentInfo", JSON.stringify(studentInfo));
    setStep("exam");
  };

  const saveAnswer = (answer: string | string[]) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examSetId: examId, studentInfo, userAnswers }),
      });
      const result = await response.json();
      if (result.success) {
        sessionStorage.removeItem("studentInfo");
        router.push(`/result?score=${result.score}&totalPoints=${result.totalPoints}`);
      } else {
        throw new Error(result.error || "ไม่สามารถส่งคำตอบได้");
      }
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : "ไม่ทราบสาเหตุ"}`);
      setIsSubmitting(false);
    }
  }, [examId, studentInfo, userAnswers, router, isSubmitting]);

  const isAnswered = (i: number) => {
    const a = userAnswers[i];
    if (!a) return false;
    if (Array.isArray(a)) return a.some((x) => x && x.length > 0);
    return a.length > 0;
  };

  // Loading
  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="text-center">
          <Icon name="spinner" size="xl" className="text-indigo-600 mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อสอบ...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !examSet) {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="p-8 text-center">
            <Icon name="error" size="xl" className="text-red-500 mb-4" />
            <h1 className="text-lg font-bold text-gray-900 mb-2">ไม่พบข้อสอบ</h1>
            <p className="text-gray-500 text-sm">{error || "กรุณาตรวจสอบลิงก์อีกครั้ง"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Closed
  if (!examSet.isActive) {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="lock" size="lg" className="text-amber-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">ข้อสอบนี้ปิดแล้ว</h1>
            <p className="text-gray-500 text-sm">ชุดข้อสอบนี้ไม่เปิดให้ทำในขณะนี้</p>
          </div>
        </div>
      </div>
    );
  }

  // Check scheduled time - not yet started
  const now = new Date();
  const scheduledStart = examSet.scheduledStart ? new Date(examSet.scheduledStart) : null;
  const scheduledEnd = examSet.scheduledEnd ? new Date(examSet.scheduledEnd) : null;

  if (scheduledStart && now < scheduledStart) {
    const formatDateTime = (date: Date) => {
      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="clock" size="lg" className="text-blue-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">ยังไม่ถึงเวลาสอบ</h1>
            <p className="text-gray-500 text-sm mb-4">
              ข้อสอบจะเปิดให้ทำเมื่อ
            </p>
            <p className="text-lg font-semibold text-indigo-600">
              {formatDateTime(scheduledStart)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check scheduled time - expired
  if (scheduledEnd && now > scheduledEnd) {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="clock" size="lg" className="text-red-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">หมดเวลาสอบแล้ว</h1>
            <p className="text-gray-500 text-sm">ชุดข้อสอบนี้เลยกำหนดเวลาแล้ว</p>
          </div>
        </div>
      </div>
    );
  }

  // No questions
  if (examSet.questions.length === 0) {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="warning" size="lg" className="text-amber-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">ยังไม่มีคำถาม</h1>
            <p className="text-gray-500 text-sm">กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Instructions
  if (step === "instructions") {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="bg-indigo-600 px-6 py-4 text-white text-center">
            <h1 className="text-lg font-bold">{examSet.title}</h1>
            <p className="text-indigo-200 text-sm mt-1">
              {examSet.questions.length} ข้อ • {examSet.timeLimitMinutes ? `${examSet.timeLimitMinutes} นาที` : "ไม่จำกัดเวลา"}
            </p>
          </div>
          <div className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="info" size="sm" className="text-indigo-600" />
              คำชี้แจงการสอบ
            </h2>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">1.</span>
                <span>อ่านคำถามให้ครบถ้วนก่อนตอบ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">2.</span>
                <span>เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">3.</span>
                <span>สามารถย้อนกลับแก้ไขคำตอบได้ก่อนส่ง</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">4.</span>
                <span>ห้ามสลับหน้าจอระหว่างสอบ (เกิน 3 ครั้งจะถูกส่งข้อสอบอัตโนมัติ)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">5.</span>
                <span>กดปุ่มส่งคำตอบเมื่อทำเสร็จแล้ว</span>
              </li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-amber-700 text-sm flex items-start gap-2">
                <Icon name="warning" size="sm" className="flex-shrink-0 mt-0.5" />
                <span>เมื่อเริ่มทำข้อสอบแล้ว เวลาจะเริ่มนับถอยหลังทันที</span>
              </p>
            </div>
            <button
              onClick={handleContinueToInfo}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              ดำเนินการต่อ
              <Icon name="arrow-right" size="sm" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Student Info
  if (step === "info") {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="bg-indigo-600 px-6 py-4 text-white text-center">
            <h1 className="text-lg font-bold">{examSet.title}</h1>
            <p className="text-indigo-200 text-sm mt-1">กรอกข้อมูลผู้เข้าสอบ</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                <input
                  type="text"
                  value={studentInfo.firstName}
                  onChange={(e) => setStudentInfo({ ...studentInfo, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="ชื่อ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
                <input
                  type="text"
                  value={studentInfo.lastName}
                  onChange={(e) => setStudentInfo({ ...studentInfo, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="นามสกุล"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักเรียน *</label>
              <input
                type="text"
                value={studentInfo.studentId}
                onChange={(e) => setStudentInfo({ ...studentInfo, studentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="เช่น 65001"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่</label>
                <input
                  type="text"
                  value={studentInfo.studentNumber}
                  onChange={(e) => setStudentInfo({ ...studentInfo, studentNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="เช่น 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ห้อง</label>
                <input
                  type="text"
                  value={studentInfo.classroom}
                  onChange={(e) => setStudentInfo({ ...studentInfo, classroom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="เช่น ม.6/1"
                />
              </div>
            </div>
            <button
              onClick={handleStartExam}
              className="w-full mt-2 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              เริ่มทำข้อสอบ
              <Icon name="arrow-right" size="sm" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Exam
  const questions = shuffledQuestions.length > 0 ? shuffledQuestions : examSet.questions;
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;
  
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const timerPct = timeLeft && examTimeSeconds ? (timeLeft / examTimeSeconds) * 100 : 100;
  const hasTimeLimit = examTimeSeconds !== null && timeLeft !== null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-lg shadow-md max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="warning" size="lg" className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">คำเตือน!</h2>
            <p className="text-gray-600 text-sm mb-2">คุณสลับหน้าจอระหว่างทำข้อสอบ</p>
            <p className="text-red-600 font-bold mb-4">ครั้งที่ {tabSwitchCount} / {MAX_TAB_SWITCHES}</p>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-t-lg px-5 py-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold truncate flex-1">{examSet.title}</span>
            {tabSwitchCount > 0 && (
              <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full ml-2">⚠️ {tabSwitchCount}/{MAX_TAB_SWITCHES}</span>
            )}
          </div>
          {hasTimeLimit ? (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-center mb-2">เวลาคงเหลือ: <span className="font-bold">{formatTime(timeLeft)}</span></div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${getTimerColor()}`} style={{ width: `${timerPct}%` }} />
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <span className="text-green-300">ไม่จำกัดเวลา</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="bg-gray-100 border-b border-gray-200 px-5 py-4">
          <div className="flex flex-wrap justify-center gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestionIndex(i)}
                className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                  isAnswered(i) ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                } ${i === currentQuestionIndex ? "ring-2 ring-gray-800 scale-110" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-b-lg shadow-md p-6">
          <p className="text-sm text-gray-500 mb-4">คำถามที่ {currentQuestionIndex + 1} / {questions.length}</p>
          
          {currentQuestion.type === "CODEMSA" ? (
            <pre className="mb-6 p-4 bg-gray-900 text-gray-200 rounded-lg font-mono text-sm whitespace-pre-wrap">{currentQuestion.text}</pre>
          ) : (
            <p className="mb-6 text-base font-medium text-gray-900">ข้อ {currentQuestionIndex + 1}. {currentQuestion.text}</p>
          )}

          <div className="space-y-3">
            {currentQuestion.type === "CHOICE" && currentQuestion.options?.map((opt, i) => {
              const isSelected = userAnswers[currentQuestionIndex] === opt;
              return (
                <button
                  key={i}
                  onClick={() => saveAnswer(opt)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected ? "border-gray-800 bg-gray-100" : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                    isSelected ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-500"
                  }`}>{optionLabels[i]}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
            
            {currentQuestion.type === "SHORT" && (
              <input
                type="text"
                value={(userAnswers[currentQuestionIndex] as string) || ""}
                onChange={(e) => saveAnswer(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-gray-800 focus:outline-none"
                placeholder="พิมพ์คำตอบ..."
              />
            )}
            
            {currentQuestion.type === "CODEMSA" && currentQuestion.subQuestions?.map((subQ, i) => {
              const answers = (userAnswers[currentQuestionIndex] as string[]) || [];
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm min-w-[60px]">{subQ}</span>
                  <input
                    type="text"
                    value={answers[i] || ""}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[i] = e.target.value;
                      saveAnswer(newAnswers);
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-gray-800 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              ย้อนกลับ
            </button>
            {isLastQuestion ? (
              <button
                onClick={() => confirm("คุณต้องการส่งคำตอบใช่หรือไม่?") && handleSubmit()}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex((p) => Math.min(questions.length - 1, p + 1))}
                className="flex-1 py-3 border border-gray-800 rounded-lg font-medium text-gray-800 hover:bg-gray-50"
              >
                ถัดไป
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
