"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import Link from "next/link";

import Icon from "@/components/Icon";
import ImportQuestionsModal from "@/components/ImportQuestionsModal";

// Types
type QuestionType = "CHOICE" | "SHORT" | "CODEMSA";

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  points: number;
  options: string[];
  correctAnswers: string[];
  subQuestions: string[];
  examSetId: string;
}

interface ExamSet {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  isActive: boolean;
  questions: Question[];
}

interface QuestionFormData {
  text: string;
  type: QuestionType;
  points: number;
  options: { value: string }[];
  correctAnswerIndex: number; // For CHOICE
  shortAnswer: string; // For SHORT
  subQuestions: { question: string; answer: string }[]; // For CODEMSA
}

export default function ExamEditorPage() {
  const params = useParams();
  const router = useRouter();
  const examSetId = params.id as string;

  // State
  const [examSet, setExamSet] = useState<ExamSet | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Form setup
  const { register, handleSubmit, watch, setValue, reset, control } = useForm<QuestionFormData>({
    defaultValues: {
      text: "",
      type: "CHOICE",
      points: 1,
      options: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
      correctAnswerIndex: 0,
      shortAnswer: "",
      subQuestions: [],
    },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: "options",
  });

  const { fields: subQuestionFields, append: appendSubQ, remove: removeSubQ } = useFieldArray({
    control,
    name: "subQuestions",
  });

  const watchType = watch("type");

  // Fetch exam set
  const fetchExamSet = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/exam-sets/${examSetId}`);
      if (response.ok) {
        const data = await response.json();
        setExamSet(data);
        if (data.questions.length > 0 && !selectedQuestionId) {
          setSelectedQuestionId(data.questions[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching exam set:", error);
    } finally {
      setIsLoading(false);
    }
  }, [examSetId, selectedQuestionId]);

  useEffect(() => {
    fetchExamSet();
  }, [fetchExamSet]);

  // Load question into form when selected
  useEffect(() => {
    if (!examSet || !selectedQuestionId) return;

    const question = examSet.questions.find((q) => q.id === selectedQuestionId);
    if (!question) return;

    // Reset form with question data
    const formData: QuestionFormData = {
      text: question.text,
      type: question.type as QuestionType,
      points: question.points,
      options: question.options.map((o) => ({ value: o })),
      correctAnswerIndex: Math.max(0, question.options.indexOf(question.correctAnswers[0])),
      shortAnswer: question.type === "SHORT" ? question.correctAnswers[0] || "" : "",
      subQuestions:
        question.type === "CODEMSA"
          ? question.subQuestions.map((sq, i) => ({
              question: sq,
              answer: question.correctAnswers[i] || "",
            }))
          : [],
    };

    reset(formData);
  }, [selectedQuestionId, examSet, reset]);

  // Save question
  const onSave = async (data: QuestionFormData) => {
    if (!selectedQuestionId) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Build correct answers based on type
      let correctAnswers: string[] = [];
      let options: string[] = [];
      let subQuestions: string[] = [];

      if (data.type === "CHOICE") {
        options = data.options.map((o) => o.value).filter((v) => v.trim());
        const answerIndex = typeof data.correctAnswerIndex === 'string' 
          ? parseInt(data.correctAnswerIndex, 10) 
          : data.correctAnswerIndex;
        correctAnswers = [options[answerIndex] || options[0]];
      } else if (data.type === "SHORT") {
        correctAnswers = [data.shortAnswer];
      } else if (data.type === "CODEMSA") {
        subQuestions = data.subQuestions.map((sq) => sq.question);
        correctAnswers = data.subQuestions.map((sq) => sq.answer);
      }

      const response = await fetch(`/api/questions/${selectedQuestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.text,
          type: data.type,
          points: data.points,
          options,
          correctAnswers,
          subQuestions,
        }),
      });

      if (response.ok) {
        setSaveMessage("บันทึกเรียบร้อย!");
        // Refresh data
        await fetchExamSet();
      } else {
        setSaveMessage("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error saving:", error);
      setSaveMessage("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  // Add new question
  const handleAddQuestion = async () => {
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examSetId }),
      });

      if (response.ok) {
        const newQuestion = await response.json();
        await fetchExamSet();
        setSelectedQuestionId(newQuestion.id);
      }
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("คุณต้องการลบคำถามนี้ใช่หรือไม่?")) return;

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchExamSet();
        if (selectedQuestionId === questionId) {
          const remaining = examSet?.questions.filter((q) => q.id !== questionId);
          setSelectedQuestionId(remaining?.[0]?.id || null);
        }
      }
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  // Question type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "CHOICE": return "ปรนัย";
      case "SHORT": return "เติมคำ";
      case "CODEMSA": return "โค้ด";
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <Icon name="spinner" size="lg" className="text-indigo-600" />
        </div>
      </>
    );
  }

  if (!examSet) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Icon name="error" size="xl" className="text-red-500" />
          <p className="text-gray-600">ไม่พบชุดข้อสอบ</p>
          <Link href="/admin/dashboard" className="text-indigo-600 hover:underline">
            กลับหน้า Dashboard
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Mobile Overlay */}
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Left Sidebar - Question List */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          w-72 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600"
              >
                <Icon name="arrow-left" size="sm" />
                กลับ
              </Link>
              {/* Close button for mobile */}
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="md:hidden p-1 text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            <h2 className="font-bold text-gray-900 truncate mt-3">{examSet.title}</h2>
            <p className="text-xs text-gray-500 mt-1">
              {examSet.questions.length} คำถาม
            </p>
          </div>

          {/* Add Question Button */}
          <div className="p-3 border-b border-gray-200 space-y-2">
            <button
              onClick={handleAddQuestion}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Icon name="plus" size="sm" />
              เพิ่มคำถาม
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Icon name="upload" size="sm" />
              Import CSV
            </button>
          </div>

          {/* Question List */}
          <div className="flex-1 overflow-y-auto">
            {examSet.questions.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                ยังไม่มีคำถาม
              </div>
            ) : (
              examSet.questions.map((question, index) => (
                <div
                  key={question.id}
                  onClick={() => {
                    setSelectedQuestionId(question.id);
                    setShowMobileSidebar(false); // Close sidebar on mobile when selecting
                  }}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedQuestionId === question.id
                      ? "bg-indigo-50 border-l-4 border-l-indigo-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">
                          #{index + 1}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {getTypeLabel(question.type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {question.points} คะแนน
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {question.text || "ไม่มีข้อความ"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(question.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Icon name="trash" size="xs" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Question Editor */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          {selectedQuestionId ? (
            <form onSubmit={handleSubmit(onSave)} className="p-4 md:p-6 max-w-3xl mx-auto">
              {/* Mobile Header with Menu Button */}
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  {/* Mobile menu button */}
                  <button
                    type="button"
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <Icon name="menu" size="md" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">แก้ไขคำถาม</h3>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  {saveMessage && (
                    <span className={`text-xs md:text-sm ${saveMessage.includes("เรียบร้อย") ? "text-green-600" : "text-red-600"}`}>
                      {saveMessage}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Icon name="spinner" size="sm" />
                    ) : (
                      <Icon name="check-circle" size="sm" />
                    )}
                    <span className="hidden sm:inline">บันทึก</span>
                  </button>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ข้อความคำถาม
                  </label>
                  <textarea
                    {...register("text")}
                    rows={3}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="พิมพ์คำถาม..."
                  />
                </div>

                {/* Points & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คะแนน
                    </label>
                    <input
                      type="number"
                      {...register("points", { valueAsNumber: true })}
                      min={1}
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภทคำถาม
                    </label>
                    <select
                      {...register("type")}
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="CHOICE">ปรนัย (CHOICE)</option>
                      <option value="SHORT">เติมคำตอบ (SHORT)</option>
                      <option value="CODEMSA">โค้ด (CODEMSA)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Fields based on Type */}
                {watchType === "CHOICE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      ตัวเลือก (เลือกคำตอบที่ถูกต้อง)
                    </label>
                    <div className="space-y-3">
                      {optionFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3">
                          <input
                            type="radio"
                            {...register("correctAnswerIndex")}
                            value={index}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-600 rounded text-sm font-medium">
                            {["ก", "ข", "ค", "ง", "จ", "ฉ"][index]}
                          </span>
                          <input
                            {...register(`options.${index}.value`)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder={`ตัวเลือก ${["ก", "ข", "ค", "ง", "จ", "ฉ"][index]}`}
                          />
                          {optionFields.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <Icon name="trash" size="sm" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {optionFields.length < 6 && (
                      <button
                        type="button"
                        onClick={() => appendOption({ value: "" })}
                        className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        <Icon name="plus" size="sm" />
                        เพิ่มตัวเลือก
                      </button>
                    )}
                  </div>
                )}

                {watchType === "SHORT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำตอบที่ถูกต้อง
                    </label>
                    <input
                      {...register("shortAnswer")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="พิมพ์คำตอบที่ถูกต้อง..."
                    />
                  </div>
                )}

                {watchType === "CODEMSA" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      คำถามย่อยและคำตอบ
                    </label>
                    <div className="space-y-3">
                      {subQuestionFields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="mt-2 w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded text-sm font-bold">
                            {index + 1}
                          </span>
                          <div className="flex-1 space-y-2">
                            <input
                              {...register(`subQuestions.${index}.question`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="คำถามย่อย..."
                            />
                            <input
                              {...register(`subQuestions.${index}.answer`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="คำตอบ..."
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSubQ(index)}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Icon name="trash" size="sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => appendSubQ({ question: "", answer: "" })}
                      className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Icon name="plus" size="sm" />
                      เพิ่มคำถามย่อย
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              {/* Mobile: Show button to open sidebar */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
              >
                <Icon name="menu" size="sm" />
                ดูรายการคำถาม
              </button>
              <Icon name="document" size="xl" className="mb-3" />
              <p className="text-center">เลือกคำถามจากรายการ<span className="hidden md:inline">ด้านซ้าย</span></p>
              <p className="text-sm mt-1">หรือเพิ่มคำถามใหม่</p>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <ImportQuestionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        examSetId={examSetId}
        onSuccess={fetchExamSet}
      />
    </>
  );
}
