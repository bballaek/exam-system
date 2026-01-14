"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import Link from "next/link";

import Icon from "@/components/Icon";
import ImportQuestionsModal from "@/components/ImportQuestionsModal";
import { useToast } from "@/components/Toast";

// Types
type QuestionType = "CHOICE" | "SHORT" | "CODEMSA" | "TRUE_FALSE";

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  points: number;
  isRequired: boolean;
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
  // Scheduling fields
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  timeLimitMinutes?: number | null;
  shuffleQuestions?: boolean;
  lockScreen?: boolean;
  // Pre-Post Test fields
  examType?: string;
  pairId?: string | null;
}

interface QuestionFormData {
  text: string;
  type: QuestionType;
  points: number;
  isRequired: boolean;
  isMultiAnswer: boolean; // Allow multiple correct answers
  options: { value: string }[];
  correctAnswerIndex: number; // For CHOICE (single)
  correctAnswerIndices: number[]; // For CHOICE (multi)
  shortAnswer: string; // For SHORT (comma separated for multi)
  trueFalseAnswer: boolean; // For TRUE_FALSE
  subQuestions: { question: string; answer: string }[]; // For CODEMSA
}

export default function ExamEditorPage() {
  const params = useParams();
  const router = useRouter();
  const examSetId = params.id as string;
  const toast = useToast();

  // State
  const [examSet, setExamSet] = useState<ExamSet | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Scheduling form state
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [lockScreen, setLockScreen] = useState(false);
  const [examType, setExamType] = useState("general");
  const [pairId, setPairId] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Form setup
  const { register, handleSubmit, watch, setValue, reset, control } = useForm<QuestionFormData>({
    defaultValues: {
      text: "",
      type: "CHOICE",
      points: 1,
      isRequired: true,
      isMultiAnswer: false,
      options: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
      correctAnswerIndex: 0,
      correctAnswerIndices: [],
      shortAnswer: "",
      trueFalseAnswer: true,
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

  // Load scheduling data when examSet is fetched
  useEffect(() => {
    if (examSet) {
      setScheduledStart(examSet.scheduledStart ? examSet.scheduledStart.slice(0, 16) : "");
      setScheduledEnd(examSet.scheduledEnd ? examSet.scheduledEnd.slice(0, 16) : "");
      setTimeLimitMinutes(examSet.timeLimitMinutes || null);
      setShuffleQuestions(examSet.shuffleQuestions || false);
      setLockScreen(examSet.lockScreen || false);
      setExamType(examSet.examType || "general");
      setPairId(examSet.pairId || "");
    }
  }, [examSet]);

  // Save scheduling settings
  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch(`/api/exam-sets/${examSetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
          timeLimitMinutes: timeLimitMinutes || null,
          shuffleQuestions,
          lockScreen,
          examType,
          pairId: pairId || null,
        }),
      });
      if (response.ok) {
        setShowSettingsModal(false);
        fetchExamSet();
        toast.showToast("success", "บันทึกการตั้งค่าสำเร็จ");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || "เกิดข้อผิดพลาดในการบันทึก";
        console.error("Error saving settings:", errorMessage);
        toast.showToast("error", errorMessage);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      toast.showToast("error", errorMessage);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Load question into form when selected
  useEffect(() => {
    if (!examSet || !selectedQuestionId) return;

    const question = examSet.questions.find((q) => q.id === selectedQuestionId);
    if (!question) return;

    // Reset form with question data
    // Determine if multi-answer based on correctAnswers count
    const isMulti = question.correctAnswers.length > 1;
    const correctIndices = question.correctAnswers
      .map(ans => question.options.indexOf(ans))
      .filter(i => i >= 0);
    
    const formData: QuestionFormData = {
      text: question.text,
      type: question.type as QuestionType,
      points: question.points,
      isRequired: question.isRequired ?? true,
      isMultiAnswer: isMulti,
      options: question.options.map((o) => ({ value: o })),
      correctAnswerIndex: correctIndices[0] ?? 0,
      correctAnswerIndices: correctIndices,
      shortAnswer: question.type === "SHORT" ? question.correctAnswers.join(",") : "",
      trueFalseAnswer: question.type === "TRUE_FALSE" ? question.correctAnswers[0] === "TRUE" : true,
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
        if (data.isMultiAnswer && data.correctAnswerIndices.length > 0) {
          // Multi-answer: get all selected options
          correctAnswers = data.correctAnswerIndices
            .filter(i => i < options.length)
            .map(i => options[i]);
        } else {
          // Single answer
          const answerIndex = typeof data.correctAnswerIndex === 'string' 
            ? parseInt(data.correctAnswerIndex, 10) 
            : data.correctAnswerIndex;
          correctAnswers = [options[answerIndex] || options[0]];
        }
      } else if (data.type === "SHORT") {
        // Support comma-separated answers for multi-answer
        correctAnswers = data.shortAnswer.split(",").map(s => s.trim()).filter(s => s);
      } else if (data.type === "TRUE_FALSE") {
        correctAnswers = [data.trueFalseAnswer ? "TRUE" : "FALSE"];
      } else if (data.type === "CODEMSA") {
        subQuestions = data.subQuestions.map((sq) => sq.question);
        // Support comma-separated answers for each sub-question
        correctAnswers = data.subQuestions.map((sq) => sq.answer);
      }

      const response = await fetch(`/api/questions/${selectedQuestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.text,
          type: data.type,
          points: data.points,
          isRequired: data.isRequired,
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
            Back
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-60px)] lg:h-screen relative">
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
          w-72 bg-gray-50 border-r border-gray-200 flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link
                href="/admin/exams"
                className="inline-flex items-center gap-2 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <Icon name="arrow-left" size="sm" />
                Back
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
              Add Question
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Icon name="upload" size="sm" />
                Import
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Icon name="settings" size="sm" />
                Settings
              </button>
            </div>
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
                  className={`p-3 border-b border-gray-50 cursor-pointer transition-all duration-200 ${
                    selectedQuestionId === question.id
                      ? "bg-indigo-50/50 border border-indigo-200 shadow-sm"
                      : "hover:bg-gray-50 border-transparent"
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
        <div className="flex-1 bg-surface overflow-y-auto h-[calc(100vh-56px)] mt-10">
          {selectedQuestionId ? (
            <form onSubmit={handleSubmit(onSave)} className="p-4 md:p-6 max-w-3xl mx-auto">
              {/* Mobile Header with Menu Button */}
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  {/* Mobile menu button */}
                  <button
                    type="button"
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden p-2 -ml-2 text-gray-200 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <Icon name="menu" size="md" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">Edit Questions</h3>
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
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Type, Points & Required Toggle Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    {/* Type Selector - matching Points Badge style */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center px-3 py-2 bg-gray-50 border-r border-gray-200">
                        <Icon name="check-circle" size="sm" className="text-indigo-600" />
                      </div>
                      <div className="relative">
                        <select
                          {...register("type")}
                          className="appearance-none px-4 py-2 pr-8 border-0 text-sm font-medium text-gray-700 focus:ring-0 focus:outline-none cursor-pointer bg-white min-w-[140px]"
                        >
                          <option value="CHOICE">Multiple choice</option>
                          <option value="TRUE_FALSE">True/False</option>
                          <option value="SHORT">Fill in the Blank</option>
                          <option value="CODEMSA">Code</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <Icon name="chevron-down" size="xs" className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Points Badge */}
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Mark as point</span>
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <input
                          type="number"
                          {...register("points", { valueAsNumber: true })}
                          min={1}
                          className="w-12 px-2 py-1.5 border-0 text-sm font-medium text-center focus:ring-0"
                        />
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-l border-gray-200">
                          <span className="text-sm text-gray-600">Points</span>
                          <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                            <Icon name="star" size="xs" className="text-white" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Required Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Required</span>
                    <button
                      type="button"
                      onClick={() => setValue("isRequired", !watch("isRequired"))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        watch("isRequired") ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          watch("isRequired") ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text {watch("isRequired") && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    {...register("text")}
                    rows={3}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="พิมพ์คำถาม..."
                  />
                </div>

                {/* Dynamic Fields based on Type */}
                {watchType === "CHOICE" && (
                  <div>
                    {/* Choices Header with Multi Answer Toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Choices <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-4">
                        {/* Multi Answer Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Multiple answer</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newValue = !watch("isMultiAnswer");
                              setValue("isMultiAnswer", newValue);
                              // Reset selections when switching modes
                              if (newValue) {
                                setValue("correctAnswerIndices", [watch("correctAnswerIndex")]);
                              } else {
                                const firstSelected = watch("correctAnswerIndices")[0] ?? 0;
                                setValue("correctAnswerIndex", firstSelected);
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              watch("isMultiAnswer") ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                watch("isMultiAnswer") ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Options List */}
                    <div className="space-y-3">
                      {optionFields.map((field, index) => {
                        const isMulti = watch("isMultiAnswer");
                        const watchedIndex = watch("correctAnswerIndex");
                        const watchedIndices = watch("correctAnswerIndices") || [];
                        const isChecked = isMulti 
                          ? watchedIndices.includes(index)
                          : Number(watchedIndex) === index;
                        
                        const handleSelect = () => {
                          if (isMulti) {
                            // Toggle checkbox
                            const current = [...watchedIndices];
                            const idx = current.indexOf(index);
                            if (idx >= 0) {
                              current.splice(idx, 1);
                            } else {
                              current.push(index);
                            }
                            setValue("correctAnswerIndices", current);
                          } else {
                            // Radio behavior
                            setValue("correctAnswerIndex", index);
                          }
                        };
                        
                        return (
                          <div key={field.id} className="flex items-center gap-3">
                            <input
                              type={isMulti ? "checkbox" : "radio"}
                              name="correctAnswer"
                              checked={isChecked}
                              onChange={handleSelect}
                              className={`w-5 h-5 ${isMulti ? 'text-indigo-600 rounded' : 'text-indigo-600'} border-gray-300 focus:ring-indigo-500`}
                            />
                            <input
                              {...register(`options.${index}.value`)}
                              className={`flex-1 px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                isChecked ? "border-indigo-300 bg-indigo-50" : "border-gray-200"
                              }`}
                              placeholder={`Option ${index + 1}`}
                            />
                            <button type="button" className="p-1 text-gray-300 hover:text-gray-400">
                              <Icon name="menu" size="sm" />
                            </button>
                            {optionFields.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <Icon name="trash" size="sm" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {optionFields.length < 6 && (
                      <button
                        type="button"
                        onClick={() => appendOption({ value: "" })}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 border border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                      >
                        <Icon name="plus" size="sm" />
                        Add answers
                      </button>
                    )}
                  </div>
                )}

                {watchType === "SHORT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer(s)
                    </label>
                    <input
                      {...register("shortAnswer")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Type correct answer..."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      💡 For multiple acceptable answers, separate with comma (e.g., blink,light)
                    </p>
                  </div>
                )}

                {watchType === "TRUE_FALSE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      คำตอบที่ถูกต้อง
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setValue("trueFalseAnswer", true)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                          watch("trueFalseAnswer") === true
                            ? "bg-green-500 text-white ring-2 ring-green-300"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Icon name="check-circle" size="sm" />
                        ถูก (TRUE)
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("trueFalseAnswer", false)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                          watch("trueFalseAnswer") === false
                            ? "bg-red-500 text-white ring-2 ring-red-300"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Icon name="close" size="sm" />
                        ผิด (FALSE)
                      </button>
                    </div>
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
                      Add Sub Question
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon name="settings" size="sm" className="text-gray-600" />
                ตั้งค่าข้อสอบ
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  เวลาทำข้อสอบ (นาที)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    value={timeLimitMinutes || ""}
                    onChange={(e) => setTimeLimitMinutes(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="60"
                    className="w-24 px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                  />
                  <span className="text-sm text-gray-500">
                    {timeLimitMinutes ? `(${Math.floor(timeLimitMinutes / 60)} ชม. ${timeLimitMinutes % 60} นาที)` : "ไม่จำกัดเวลา"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">ปล่อยว่างไว้ = ไม่จำกัดเวลา</p>
              </div>

              {/* Scheduled Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  เวลาเปิดสอบ
                </label>
                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Scheduled End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  เวลาปิดสอบ
                </label>
                <input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Shuffle Questions Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-gray-700">สลับลำดับข้อสอบ</p>
                  <p className="text-xs text-gray-500">ลำดับข้อสอบจะสุ่มใหม่สำหรับนักเรียนแต่ละคน</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShuffleQuestions(!shuffleQuestions)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    shuffleQuestions ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      shuffleQuestions ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Lock Screen Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-gray-700">ล็อกหน้าจอระหว่างทำข้อสอบ</p>
                  <p className="text-xs text-gray-500">ป้องกันนักเรียนออกจากหน้าจอระหว่างทำข้อสอบ</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLockScreen(!lockScreen)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    lockScreen ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      lockScreen ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Exam Type Selector */}
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-sm font-medium text-gray-700 mb-3">ประเภทข้อสอบ</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="examType"
                      value="general"
                      checked={examType === "general"}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">ทั่วไป (General)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="examType"
                      value="pretest"
                      checked={examType === "pretest"}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">ก่อนเรียน (Pre-test)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="examType"
                      value="posttest"
                      checked={examType === "posttest"}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">หลังเรียน (Post-test)</span>
                  </label>
                </div>

                {/* Pair ID - show only for pre/post test */}
                {(examType === "pretest" || examType === "posttest") && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      รหัสชุดคู่ (Pair ID)
                    </label>
                    <input
                      type="text"
                      value={pairId}
                      onChange={(e) => setPairId(e.target.value)}
                      placeholder="เช่น unit-1, chapter-3"
                      className="w-full px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      ข้อสอบ Pre และ Post ที่มี Pair ID เดียวกันจะถูกนำมาวิเคราะห์เปรียบเทียบด้วยกัน
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveSettings}
                disabled={isSavingSettings}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingSettings ? (
                  <>
                    <Icon name="spinner" size="sm" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึก"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
