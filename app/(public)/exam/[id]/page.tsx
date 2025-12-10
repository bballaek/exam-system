"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";

// Types
type QuestionType = "CHOICE" | "SHORT" | "CODEMSA" | "TRUE_FALSE";

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
const containerClass = "min-h-screen bg-surface flex items-center justify-center p-4";
const cardClass = "w-full max-w-lg rounded-xl border border-border bg-card overflow-hidden";

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
  const toast = useToast();
  
  // Anti-cheat
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  // Shuffled questions (for display)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  
  // Saved/Bookmarked questions
  const [savedQuestions, setSavedQuestions] = useState<Set<number>>(new Set());
  
  // Instructions accepted checkbox
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);

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
            toast.showToast("error", `คุณสลับหน้าจอเกิน ${MAX_TAB_SWITCHES} ครั้ง ระบบจะส่งคำตอบอัตโนมัติ`);
            handleSubmit();
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [step, isSubmitting]);

  // Fullscreen exit detection
  useEffect(() => {
    if (step !== "exam" || isSubmitting) return;
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          toast.showToast("warning", `คุณออกจากโหมดเต็มหน้าจอ! (เตือนครั้งที่ ${newCount}/${MAX_TAB_SWITCHES})`);
          setShowWarning(true);
          if (newCount >= MAX_TAB_SWITCHES) {
            toast.showToast("error", `คุณออกจากโหมดเต็มหน้าจอเกิน ${MAX_TAB_SWITCHES} ครั้ง ระบบจะส่งคำตอบอัตโนมัติ`);
            handleSubmit();
          }
          return newCount;
        });
      }
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
  
  const handleStartExam = async () => {
    if (!studentInfo.firstName.trim() || !studentInfo.lastName.trim() || !studentInfo.studentId.trim()) {
      toast.showToast("warning", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    
    // Request fullscreen
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
      toast.showToast("info", "ไม่สามารถเปิดโหมดเต็มหน้าจอได้ กรุณากด F11");
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
      // Build answers array with questionId to handle shuffled questions
      const answersWithId = shuffledQuestions.map((question, index) => ({
        questionId: question.id,
        answer: userAnswers[index],
      }));
      
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          examSetId: examId, 
          studentInfo, 
          answersWithId  // Send answers with questionId
        }),
      });
      const result = await response.json();
      if (result.success) {
        sessionStorage.removeItem("studentInfo");
        const fullName = `${studentInfo.firstName} ${studentInfo.lastName}`;
        const examTitle = encodeURIComponent(examSet?.title || "แบบทดสอบ");
        router.push(`/result?score=${result.score}&totalPoints=${result.totalPoints}&name=${encodeURIComponent(fullName)}&examId=${examId}&examTitle=${examTitle}`);
      } else {
        throw new Error(result.error || "ไม่สามารถส่งคำตอบได้");
      }
    } catch (err) {
      toast.showToast("error", `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : "ไม่ทราบสาเหตุ"}`);
      setIsSubmitting(false);
    }
  }, [examId, studentInfo, userAnswers, shuffledQuestions, router, isSubmitting]);

  const isAnswered = (i: number) => {
    const a = userAnswers[i];
    if (!a) return false;
    if (Array.isArray(a)) return a.some((x) => x && x.length > 0);
    return a.length > 0;
  };

  // Toggle save/bookmark question
  const toggleSaveQuestion = (index: number) => {
    setSavedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        toast.showToast("info", `ยกเลิกบันทึกข้อ ${index + 1}`);
      } else {
        newSet.add(index);
        toast.showToast("success", `บันทึกข้อ ${index + 1} แล้ว`);
      }
      return newSet;
    });
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


  if (step === "instructions") {
    return (
      <div className="min-h-screen bg-surface py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-muted">
              <h2 className="text-xl font-bold text-gray-900">{examSet.title}</h2>
              <p className="text-sm text-gray-500 mt-1">กรุณาอ่านคำชี้แจงก่อนเริ่มทำข้อสอบ</p>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-border bg-muted p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                    <Icon name="file" size="sm" className="text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{examSet.questions.length}</div>
                    <div className="text-xs text-gray-500 font-medium">จำนวนข้อ</div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                    <Icon name="clock" size="sm" className="text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{examSet.timeLimitMinutes || "∞"}</div>
                    <div className="text-xs text-gray-500 font-medium">{examSet.timeLimitMinutes ? "นาที" : "ไม่จำกัดเวลา"}</div>
                  </div>
                </div>
              </div>

              {/* Section 1: General Rules */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Icon name="info" size="sm" className="text-gray-600" />
                  กฎทั่วไป
                </h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex gap-2 items-start">
                    <span className="text-gray-900 font-bold">1.</span>
                    อ่านคำถามให้ครบถ้วนก่อนเลือกคำตอบ
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-gray-900 font-bold">2.</span>
                    เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-gray-900 font-bold">3.</span>
                    สามารถย้อนกลับแก้ไขคำตอบได้ก่อนส่ง
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-gray-900 font-bold">4.</span>
                    <span><strong className="text-red-500">ห้ามรีเฟรช</strong> หรือปิดหน้าต่างระหว่างทำข้อสอบ</span>
                  </li>
                </ul>
              </div>

              {/* Section 2: Navigation */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Icon name="menu" size="sm" className="text-gray-600" />
                  การนำทาง
                </h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex gap-2 items-start">
                    <span className="text-gray-900 font-bold">•</span>
                    ใช้ปุ่ม "ถัดไป" และ "ก่อนหน้า" เพื่อเลื่อนข้อ
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-gray-900 font-bold">•</span>
                    สามารถเลือกข้อที่ต้องการจากแถบด้านขวา
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-gray-900 font-bold">•</span>
                    สลับหน้าจอเกิน 3 ครั้ง ระบบจะส่งคำตอบอัตโนมัติ
                  </li>
                </ul>
              </div>

              {/* Warning */}
              <div className="rounded-lg border border-border bg-muted p-4 mb-6">
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <Icon name="warning" size="sm" className="flex-shrink-0 mt-0.5 text-yellow-600" />
                  <span>เมื่อเริ่มทำข้อสอบแล้ว เวลาจะเริ่มนับถอยหลังทันที</span>
                </p>
              </div>

              {/* Footer / Agreement */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-border text-gray-900 focus:ring-gray-400 cursor-pointer"
                    checked={instructionsAccepted}
                    onChange={(e) => setInstructionsAccepted(e.target.checked)}
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    ข้าพเจ้าได้อ่านและเข้าใจคำชี้แจงแล้ว
                  </span>
                </label>
                
                <button 
                  onClick={handleContinueToInfo}
                  disabled={!instructionsAccepted}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                    instructionsAccepted 
                      ? "bg-gray-900 hover:bg-gray-800 text-white" 
                      : "bg-muted text-gray-400 cursor-not-allowed"
                  }`}
                >
                  ดำเนินการต่อ <Icon name="arrow-right" size="sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "info") {
    return (
      <div className="min-h-screen bg-surface py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-muted flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Icon name="user" size="sm" className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{examSet.title}</h2>
                <p className="text-sm text-gray-500">กรอกข้อมูลผู้เข้าสอบ</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={studentInfo.firstName} 
                      onChange={(e) => setStudentInfo({ ...studentInfo, firstName: e.target.value })} 
                      className="w-full px-3 py-2.5 border border-border bg-card rounded-lg text-sm focus:border-gray-900 focus:outline-none transition-all" 
                      placeholder="ชื่อ" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">นามสกุล <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={studentInfo.lastName} 
                      onChange={(e) => setStudentInfo({ ...studentInfo, lastName: e.target.value })} 
                      className="w-full px-3 py-2.5 border border-border bg-card rounded-lg text-sm focus:border-gray-900 focus:outline-none transition-all" 
                      placeholder="นามสกุล" 
                    />
                  </div>
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสนักเรียน <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={studentInfo.studentId} 
                    onChange={(e) => setStudentInfo({ ...studentInfo, studentId: e.target.value })} 
                    className="w-full px-3 py-2.5 border border-border bg-card rounded-lg text-sm focus:border-gray-900 focus:outline-none transition-all" 
                    placeholder="เช่น 65001" 
                  />
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขที่</label>
                    <input 
                      type="text" 
                      value={studentInfo.studentNumber} 
                      onChange={(e) => setStudentInfo({ ...studentInfo, studentNumber: e.target.value })} 
                      className="w-full px-3 py-2.5 border border-border bg-card rounded-lg text-sm focus:border-gray-900 focus:outline-none transition-all" 
                      placeholder="เช่น 1" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ห้อง</label>
                    <input 
                      type="text" 
                      value={studentInfo.classroom} 
                      onChange={(e) => setStudentInfo({ ...studentInfo, classroom: e.target.value })} 
                      className="w-full px-3 py-2.5 border border-border bg-card rounded-lg text-sm focus:border-gray-900 focus:outline-none transition-all" 
                      placeholder="เช่น ม.6/1" 
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 pt-4 border-t border-border">
                <button 
                  onClick={handleStartExam}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-gray-900 hover:bg-gray-800 text-white"
                >
                  เริ่มทำข้อสอบ <Icon name="arrow-right" size="sm" />
                </button>
              </div>
            </div>
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
  const answeredCount = userAnswers.filter((_, i) => isAnswered(i)).length;

  // Status helper for question palette
  const getQuestionStatus = (index: number) => {
    if (index === currentQuestionIndex) return "current";
    if (isAnswered(index)) return "answered";
    return "notAnswered";
  };

  return (
    <div className="min-h-screen bg-surface select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="rounded-xl border border-border bg-card max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="warning" size="lg" className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">คำเตือน!</h2>
            <p className="text-gray-600 text-sm mb-2">คุณสลับหน้าจอระหว่างทำข้อสอบ</p>
            <p className="text-red-600 font-bold mb-4">ครั้งที่ {tabSwitchCount} / {MAX_TAB_SWITCHES}</p>
            <button onClick={() => setShowWarning(false)} className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800">เข้าใจแล้ว</button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-700 truncate">{examSet.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            {tabSwitchCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">⚠️ {tabSwitchCount}/{MAX_TAB_SWITCHES}</span>
            )}
            <button 
              onClick={() => confirm("คุณต้องการส่งคำตอบใช่หรือไม่?") && handleSubmit()} 
              disabled={isSubmitting}
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "กำลังส่ง..." : "ส่งคำตอบ"} <Icon name="arrow-right" size="sm" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Question Area */}
          <section className="flex-grow lg:w-3/4 flex flex-col gap-4">
            {/* Mobile Timer */}
            <div className="lg:hidden">
              <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center gap-4">
                <div className="flex-grow flex flex-col justify-center gap-1.5">
                  <div className="flex justify-between text-xs uppercase font-bold text-gray-400 tracking-wider">
                    <span>เวลาคงเหลือ</span>
                    <span>{hasTimeLimit ? `${Math.round(timerPct)}%` : "∞"}</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${getTimerColor()} rounded-full transition-all`} style={{ width: `${timerPct}%` }}></div>
                  </div>
                </div>
                <div className="flex-shrink-0 font-mono text-xl font-bold text-gray-700 tabular-nums tracking-tight border-l pl-4 border-border">
                  {hasTimeLimit ? formatTime(timeLeft) : "∞"}
                </div>
              </div>
            </div>
            
            {/* Question Card */}
            <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden min-h-[500px]">
              {/* Question Header */}
              <div className="bg-muted border-b border-border px-6 py-4 flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800">ข้อที่ {currentQuestionIndex + 1}</h2>
                <span className="text-xs text-gray-400 font-medium">{currentQuestion.type === "CHOICE" ? "ปรนัย" : currentQuestion.type === "SHORT" ? "เติมคำตอบ" : "Coding"}</span>
              </div>

              {/* Question Content */}
              <div className="px-6 py-5 flex-grow overflow-y-auto">
                {currentQuestion.type === "CODEMSA" ? (
                  <pre className="mb-6 p-4 bg-gray-900 text-gray-200 rounded-lg font-mono text-sm whitespace-pre-wrap">{currentQuestion.text}</pre>
                ) : (
                  <div className="mb-6">
                    <p className="text-gray-700 leading-relaxed text-base">{currentQuestion.text}</p>
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.type === "CHOICE" && currentQuestion.options?.map((opt, i) => {
                    const isSelected = userAnswers[currentQuestionIndex] === opt;
                    return (
                      <button
                        key={i}
                        onClick={() => saveAnswer(opt)}
                        className={`w-full flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 group text-left ${
                          isSelected 
                            ? "border-gray-900 bg-gray-50" 
                            : "border-border bg-card hover:border-gray-400"
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0 transition-colors ${
                          isSelected ? "bg-gray-900 text-white border-gray-900" : "text-gray-400 border-border group-hover:border-gray-400"
                        }`}>
                          {optionLabels[i]}
                        </span>
                        <span className="text-gray-700 font-medium text-sm">{opt}</span>
                      </button>
                    );
                  })}
                  
                  {currentQuestion.type === "SHORT" && (
                    <input 
                      type="text" 
                      value={(userAnswers[currentQuestionIndex] as string) || ""} 
                      onChange={(e) => saveAnswer(e.target.value)} 
                      className="w-full px-4 py-3 border border-border bg-card rounded-lg text-sm focus:border-gray-900 focus:outline-none transition-all" 
                      placeholder="พิมพ์คำตอบ..." 
                    />
                  )}
                  
                  {currentQuestion.type === "CODEMSA" && currentQuestion.subQuestions?.map((subQ, i) => {
                    const answers = (userAnswers[currentQuestionIndex] as string[]) || [];
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
                        <span className="font-bold text-gray-900 text-sm min-w-[60px]">{subQ}</span>
                        <input 
                          type="text" 
                          value={answers[i] || ""} 
                          onChange={(e) => { const newAnswers = [...answers]; newAnswers[i] = e.target.value; saveAnswer(newAnswers); }} 
                          className="flex-1 px-3 py-2 border border-border bg-card rounded-lg text-sm focus:border-gray-900 focus:outline-none" 
                        />
                      </div>
                    );
                  })}

                  {currentQuestion.type === "TRUE_FALSE" && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => saveAnswer("TRUE")}
                        className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-xl font-bold text-base transition-all ${
                          userAnswers[currentQuestionIndex] === "TRUE"
                            ? "bg-green-500 text-white ring-2 ring-green-300 shadow-lg"
                            : "bg-card border-2 border-border text-gray-600 hover:border-green-300 hover:bg-green-50"
                        }`}
                      >
                        <Icon name="check-circle" size="md" />
                        ถูก
                      </button>
                      <button
                        onClick={() => saveAnswer("FALSE")}
                        className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-xl font-bold text-base transition-all ${
                          userAnswers[currentQuestionIndex] === "FALSE"
                            ? "bg-red-500 text-white ring-2 ring-red-300 shadow-lg"
                            : "bg-card border-2 border-border text-gray-600 hover:border-red-300 hover:bg-red-50"
                        }`}
                      >
                        <Icon name="close" size="md" />
                        ผิด
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted border-t border-border px-6 py-4 flex flex-wrap items-center justify-between gap-3 mt-auto flex-shrink-0">
                <button 
                  onClick={() => toggleSaveQuestion(currentQuestionIndex)}
                  className={`flex items-center gap-2 font-medium text-sm px-3 py-1.5 rounded transition-all ${
                    savedQuestions.has(currentQuestionIndex)
                      ? "bg-amber-100 text-amber-700 border border-amber-300"
                      : "text-gray-500 hover:text-gray-900 hover:bg-card"
                  }`}
                >
                  <Icon name="bookmark" size="sm" />
                  <span className="hidden sm:inline">{savedQuestions.has(currentQuestionIndex) ? "บันทึกแล้ว" : "บันทึก"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))} 
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card border border-border text-gray-600 font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Icon name="chevron-left" size="sm" /> <span className="hidden sm:inline">ก่อนหน้า</span>
                  </button>
                  <button 
                    onClick={() => setCurrentQuestionIndex((p) => Math.min(questions.length - 1, p + 1))}
                    disabled={isLastQuestion}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card border border-border text-gray-600 font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">ถัดไป</span> <Icon name="chevron-right" size="sm" />
                  </button>
                </div>

                {isLastQuestion && (
                  <button 
                    onClick={() => confirm("คุณต้องการส่งคำตอบใช่หรือไม่?") && handleSubmit()}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Sidebar Area */}
          <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            {/* Desktop Timer */}
            <div className="hidden lg:block">
              <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center gap-4">
                <div className="flex-grow flex flex-col justify-center gap-1.5">
                  <div className="flex justify-between text-xs uppercase font-bold text-gray-400 tracking-wider">
                    <span>เวลาคงเหลือ</span>
                    <span>{hasTimeLimit ? `${Math.round(timerPct)}%` : "∞"}</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${getTimerColor()} rounded-full transition-all shadow-sm`} style={{ width: `${timerPct}%` }}></div>
                  </div>
                </div>
                <div className="flex-shrink-0 font-mono text-xl font-bold text-gray-700 tabular-nums tracking-tight border-l pl-4 border-border">
                  {hasTimeLimit ? formatTime(timeLeft) : "∞"}
                </div>
              </div>
            </div>

            {/* Question Palette */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 border-b border-border pb-2 text-center">สถานะการตอบ</h3>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {questions.map((_, i) => {
                  const status = getQuestionStatus(i);
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestionIndex(i)}
                      className={`w-8 h-8 rounded text-xs font-bold border transition-all duration-200 flex items-center justify-center relative ${
                        status === "current" 
                          ? "bg-gray-800 text-white border-gray-800 ring-1 ring-gray-300" 
                          : status === "answered"
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-card text-gray-600 border-border hover:bg-muted"
                      }`}
                    >
                      {i + 1}
                      {savedQuestions.has(i) && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                          <Icon name="bookmark" size="xs" className="text-white w-2 h-2" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap justify-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-green-500"></div> ตอบแล้ว
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-white border border-gray-300"></div> ยังไม่ตอบ
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gray-800"></div> ข้อปัจจุบัน
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="bookmark" size="xs" className="text-amber-500" /> บันทึก
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 border-b border-gray-100 pb-2 text-center">สรุป</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm px-3 py-2 rounded bg-gray-50">
                  <span className="text-gray-500 font-medium">ทั้งหมด</span>
                  <span className="text-gray-900 font-bold">{questions.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm px-3 py-2 rounded bg-green-50">
                  <span className="text-gray-500 font-medium">ตอบแล้ว</span>
                  <span className="text-green-600 font-bold">{answeredCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm px-3 py-2 rounded bg-red-50">
                  <span className="text-gray-500 font-medium">ยังไม่ตอบ</span>
                  <span className="text-red-500 font-bold">{questions.length - answeredCount}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
