"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";

interface Question {
  id: number;
  text: string;
  type: string;
  points: number;
  options: string[];
  correctAnswers: string[];
  subQuestions: string[];
}

interface StudentAnswer {
  id: string;
  questionId: number;
  answerValue: string | string[] | null;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  manualScore: number | null;
  isManualGraded: boolean;
}

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  studentNumber?: string;
  classroom?: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  answers: StudentAnswer[];
  examSet: {
    title: string;
    questions: Question[];
  };
}

export default function GradeSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/grade/${submissionId}`);
        if (!response.ok) throw new Error("ไม่พบรายการ");
        const data = await response.json();
        setSubmission(data);
        
        // Initialize grades with existing values
        const initialGrades: Record<string, number> = {};
        data.answers.forEach((answer: StudentAnswer) => {
          initialGrades[answer.id] = answer.manualScore ?? answer.pointsEarned;
        });
        setGrades(initialGrades);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setIsLoading(false);
      }
    };

    if (submissionId) fetchSubmission();
  }, [submissionId]);

  const handleGradeChange = (answerId: string, score: number, maxPoints: number) => {
    const clampedScore = Math.min(Math.max(0, score), maxPoints);
    setGrades({ ...grades, [answerId]: clampedScore });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!submission) return;
    setIsSaving(true);

    try {
      const gradeData = Object.entries(grades).map(([answerId, score]) => ({
        answerId,
        score,
      }));

      const response = await fetch(`/api/grade/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades: gradeData }),
      });

      if (response.ok) {
        setHasChanges(false);
        toast.showToast("success", "บันทึกคะแนนเรียบร้อยแล้ว");
        router.push("/admin/dashboard");
      } else {
        throw new Error("ไม่สามารถบันทึกได้");
      }
    } catch (err) {
      toast.showToast("error", err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const getQuestion = (questionId: number) => {
    return submission?.examSet.questions.find((q) => q.id === questionId);
  };

  const formatAnswer = (answer: string | string[] | null, question: Question) => {
    if (!answer) return <span className="text-gray-400 italic">ไม่ได้ตอบ</span>;
    
    // For CODEMSA, show as code block
    if (question.type === "CODEMSA" || (typeof answer === "string" && answer.includes("\n"))) {
      return (
        <pre className="bg-gray-800 text-green-400 p-3 rounded-lg text-sm overflow-x-auto font-mono">
          {Array.isArray(answer) ? answer.join(", ") : answer}
        </pre>
      );
    }
    
    if (Array.isArray(answer)) return answer.join(", ");
    return answer;
  };

  const calculateNewTotal = () => {
    return Object.values(grades).reduce((sum, score) => sum + score, 0);
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "CHOICE": return { label: "ปรนัย", color: "bg-blue-100 text-blue-700" };
      case "SHORT": return { label: "เติมคำ", color: "bg-green-100 text-green-700" };
      case "CODEMSA": return { label: "โค้ด", color: "bg-purple-100 text-purple-700" };
      default: return { label: type, color: "bg-gray-100 text-gray-700" };
    }
  };

  // Count questions needing manual grading
  const needsManualGrading = submission?.answers.filter(a => {
    const q = getQuestion(a.questionId);
    return q && (q.type === "SHORT" || q.type === "CODEMSA");
  }).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icon name="spinner" size="xl" className="text-indigo-600" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Icon name="error" size="xl" className="text-red-500 mb-4" />
        <p className="text-gray-600">{error || "ไม่พบข้อมูล"}</p>
        <Link href="/admin/dashboard" className="mt-4 text-indigo-600 hover:underline">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <Icon name="arrow-left" size="sm" />
          กลับ
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">ตรวจข้อสอบ</h1>
            <p className="text-gray-500">{submission.examSet.title}</p>
          </div>
          {needsManualGrading > 0 && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              ต้องตรวจด้วยมือ {needsManualGrading} ข้อ
            </span>
          )}
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">ชื่อ:</span>
            <p className="font-medium">{submission.studentName}</p>
          </div>
          <div>
            <span className="text-gray-500">รหัสนักเรียน:</span>
            <p className="font-medium">{submission.studentId}</p>
          </div>
          <div>
            <span className="text-gray-500">เลขที่:</span>
            <p className="font-medium">{submission.studentNumber || "-"}</p>
          </div>
          <div>
            <span className="text-gray-500">ห้อง:</span>
            <p className="font-medium">{submission.classroom || "-"}</p>
          </div>
        </div>
      </div>

      {/* Answers List */}
      <div className="space-y-4 mb-6">
        {submission.answers.map((answer, index) => {
          const question = getQuestion(answer.questionId);
          if (!question) return null;

          const typeInfo = getQuestionTypeLabel(question.type);
          const isManualType = question.type === "SHORT" || question.type === "CODEMSA";

          return (
            <div
              key={answer.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 ${
                isManualType ? "border-amber-200" : "border-gray-200"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-500">ข้อ {index + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    {isManualType && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                        ต้องตรวจเอง
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">{question.text}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    answer.isCorrect || grades[answer.id] === answer.maxPoints
                      ? "bg-green-100 text-green-700"
                      : grades[answer.id] > 0
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {grades[answer.id] === answer.maxPoints ? "ถูก" : 
                   grades[answer.id] > 0 ? "ได้บางส่วน" : "ผิด"}
                </span>
              </div>

              {/* Student Answer */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-500 mb-1">คำตอบนักเรียน:</p>
                <div className="font-medium">{formatAnswer(answer.answerValue, question)}</div>
              </div>

              {/* Correct Answer */}
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-600 mb-1">เฉลย:</p>
                <div className="font-medium text-blue-800">
                  {question.type === "CODEMSA" ? (
                    <div className="space-y-1">
                      {question.subQuestions.map((subQ, i) => (
                        <p key={i} className="text-sm">
                          <span className="text-blue-500">{subQ}:</span> {question.correctAnswers[i]}
                        </p>
                      ))}
                    </div>
                  ) : (
                    question.correctAnswers.join(", ") || "-"
                  )}
                </div>
              </div>

              {/* Score Input with Quick Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-gray-600 font-medium">คะแนน:</label>
                
                {/* Quick score buttons */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleGradeChange(answer.id, 0, answer.maxPoints)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      grades[answer.id] === 0 
                        ? "bg-red-500 text-white" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    0
                  </button>
                  {answer.maxPoints > 1 && (
                    <button
                      type="button"
                      onClick={() => handleGradeChange(answer.id, Math.ceil(answer.maxPoints / 2), answer.maxPoints)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        grades[answer.id] === Math.ceil(answer.maxPoints / 2)
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {Math.ceil(answer.maxPoints / 2)}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGradeChange(answer.id, answer.maxPoints, answer.maxPoints)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      grades[answer.id] === answer.maxPoints
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {answer.maxPoints}
                  </button>
                </div>

                {/* Manual input */}
                <input
                  type="number"
                  min={0}
                  max={answer.maxPoints}
                  value={grades[answer.id] ?? 0}
                  onChange={(e) => handleGradeChange(answer.id, parseInt(e.target.value) || 0, answer.maxPoints)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-gray-500">/ {answer.maxPoints}</span>

                {answer.isManualGraded && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                    <Icon name="check-circle" size="xs" />
                    ตรวจแล้ว
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Summary Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 md:-mx-6 px-4 md:px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 px-4 py-2 rounded-lg">
              <span className="text-sm text-indigo-600">คะแนนรวม</span>
              <span className="ml-2 text-xl font-bold text-indigo-700">
                {calculateNewTotal()} / {submission.totalPoints}
              </span>
            </div>
            {hasChanges && (
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <Icon name="warning" size="xs" />
                มีการเปลี่ยนแปลง
              </span>
            )}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => router.back()}
              className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Icon name="spinner" size="sm" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Icon name="check-circle" size="sm" />
                  บันทึกคะแนน
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
