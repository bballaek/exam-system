"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";

import Icon from "@/components/Icon";
import LogoLoading from "@/components/LogoLoading";
import ImportQuestionsModal from "@/components/ImportQuestionsModal";
import { useToast } from "@/components/Toast";
import ImageUpload from "@/components/admin/ImageUpload";

// Types
type QuestionType = "CHOICE" | "SHORT" | "CODEMSA" | "TRUE_FALSE" | "CODE_DND" | "IMAGE_CHOICE";

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  points: number;
  isRequired: boolean;
  options: string[];
  correctAnswers: string[];
  subQuestions: string[];
  codeTemplate?: string | null; // Code template for CODEMSA / CODE_DND
  dragOptions?: string[]; // For CODE_DND
  imageUrl?: string | null; // For IMAGE_CHOICE
  optionImages?: string[]; // For IMAGE_CHOICE
  examSetId: string;
}

interface ExamSet {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  classroom: string | null;
  isActive: boolean;
  isHidden: boolean;
  questions: Question[];
  // Scheduling fields
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  timeLimitMinutes?: number | null;
  shuffleQuestions?: boolean;
  lockScreen?: boolean;
  instructions?: string[] | null;
  // Pre-Post Test fields
  examType?: string;
  pairId?: string | null;
  coverImage?: string | null;
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
  subQuestions: { question: string; answer: string }[]; // For CODEMSA / CODE_DND
  codeTemplate: string; // Code template for CODEMSA / CODE_DND
  dragOptions: { value: string }[]; // For CODE_DND
  imageUrl: string; // For IMAGE_CHOICE
  optionImages: { value: string }[]; // For IMAGE_CHOICE
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
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [classroom, setClassroom] = useState("");
  const [subject, setSubject] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Toggle state for displaying image upload field
  const [showQuestionImage, setShowQuestionImage] = useState(false);
  const [showOptionImages, setShowOptionImages] = useState<Record<number, boolean>>({});

  // Form setup
  const { register, handleSubmit, watch, setValue, getValues, reset, control } = useForm<QuestionFormData>({
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
      codeTemplate: "",
      dragOptions: [],
      imageUrl: "",
      optionImages: [],
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

  const { fields: dragOptionFields, append: appendDragOption, remove: removeDragOption } = useFieldArray({
    control,
    name: "dragOptions",
  });

  const { fields: optionImageFields, append: appendOptionImage, remove: removeOptionImage } = useFieldArray({
    control,
    name: "optionImages",
  });

  const watchType = watch("type");

  // Fetch exam set - only depends on examSetId, NOT selectedQuestionId
  // This prevents re-fetching the entire exam from DB every time a question is clicked
  const selectedQuestionIdRef = useRef(selectedQuestionId);
  selectedQuestionIdRef.current = selectedQuestionId;

  const fetchExamSet = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/exam-sets/${examSetId}`);
      if (response.ok) {
        const data = await response.json();
        setExamSet(data);
        // Only auto-select first question if none is currently selected
        if (data.questions.length > 0 && !selectedQuestionIdRef.current) {
          setSelectedQuestionId(data.questions[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching exam set:", error);
    } finally {
      setIsLoading(false);
    }
  }, [examSetId]);

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
      setCoverImage(examSet.coverImage || null);
      setIsActive(examSet.isActive || false);
      setIsHidden(examSet.isHidden || false);
      setClassroom(examSet.classroom || "");
      setSubject(examSet.subject || "");
      
      // Convert instructions array to multiline string
      if (Array.isArray(examSet.instructions)) {
        setInstructionsText(examSet.instructions.join("\n"));
      } else {
        setInstructionsText("");
      }
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
          coverImage,
          isActive,
          isHidden,
          classroom: classroom || null,
          subject: subject || null,
          instructions: instructionsText.split("\n").filter(line => line.trim() !== ""),
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
      type: question.type === "IMAGE_CHOICE" ? "CHOICE" : (question.type as QuestionType),
      points: question.points,
      isRequired: question.isRequired ?? true,
      isMultiAnswer: isMulti,
      options: question.options.map((o) => ({ value: o })),
      correctAnswerIndex: correctIndices[0] ?? 0,
      correctAnswerIndices: correctIndices,
      shortAnswer: question.type === "SHORT" ? question.correctAnswers.join(",") : "",
      trueFalseAnswer: question.type === "TRUE_FALSE" ? question.correctAnswers[0] === "TRUE" : true,
      subQuestions:
        (question.type === "CODEMSA" || question.type === "CODE_DND")
          ? question.subQuestions.map((sq, i) => ({
              question: sq,
              answer: question.correctAnswers[i] || "",
            }))
          : [],
      codeTemplate: question.codeTemplate || "",
      dragOptions: question.dragOptions ? question.dragOptions.map((v) => ({ value: v })) : [],
      imageUrl: question.imageUrl || "",
      optionImages: question.optionImages
        ? question.optionImages.map((v) => ({ value: v }))
        : Array(question.options.length || 4).fill("").map(() => ({ value: "" })),
    };

    reset(formData);
    setShowQuestionImage(!!question.imageUrl);
    const initialShowOptionImages: Record<number, boolean> = {};
    if (question.optionImages) {
      question.optionImages.forEach((v, i) => {
        if (v) initialShowOptionImages[i] = true;
      });
    }
    setShowOptionImages(initialShowOptionImages);
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
      } else if (data.type === "CODEMSA" || data.type === "CODE_DND") {
        subQuestions = data.subQuestions.map((sq) => sq.question);
        // Support comma-separated answers for each sub-question
        correctAnswers = data.subQuestions.map((sq) => sq.answer);
      } else if (data.type === "IMAGE_CHOICE") {
        // Keep empty strings for IMAGE_CHOICE because the main payload is the image
        options = data.options.map((o) => o.value);
        const answerIndex = typeof data.correctAnswerIndex === 'string' 
            ? parseInt(data.correctAnswerIndex, 10) 
            : data.correctAnswerIndex;
        // Fallback to empty string if undefined to satisfy Prisma's String[]
        correctAnswers = [options[answerIndex] !== undefined ? options[answerIndex] : ""];
      }

      const dragOptions = data.type === "CODE_DND" ? data.dragOptions.map(o => o.value).filter(v => v.trim()) : [];
      const imageUrl = data.imageUrl || null;
      const optionImages = data.optionImages ? data.optionImages.map(oi => oi.value) : [];

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
          codeTemplate: (data.type === "CODEMSA" || data.type === "CODE_DND") ? data.codeTemplate : null,
          dragOptions,
          imageUrl,
          optionImages,
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
      case "TRUE_FALSE": return "ถูก/ผิด";
      case "CODE_DND": return "Drag & Drop";
      case "IMAGE_CHOICE": return "ตัวเลือกรูปภาพ";
      default: return type;
    }
  };

  if (isLoading) {
    return <LogoLoading size="lg" text="กำลังโหลด..." />;
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
          <div className="p-4 border-b border-gray-200 lg:pl-12 relative">
            <div className="flex items-center justify-end gap-2">
              <Link
                href="/admin/exams"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <Icon name="arrow-left" size="sm" />
                Back
              </Link>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            <h2 className="font-bold text-gray-900 truncate mt-3 pr-2">{examSet.title}</h2>
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
                        {question.text?.replace(/<[^>]+>/g, '') || "ไม่มีข้อความ"}
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
                          onChange={(e) => {
                            setValue("type", e.target.value as QuestionType);
                            // Auto toggle image options if switching back and forth, or just leave it
                          }}
                          className="appearance-none px-4 py-2 pr-8 border-0 text-sm font-medium text-gray-700 focus:ring-0 focus:outline-none cursor-pointer bg-white min-w-[140px]"
                        >
                          <option value="CHOICE">Multiple choice</option>
                          <option value="TRUE_FALSE">True/False</option>
                          <option value="SHORT">Fill in the Blank</option>
                          <option value="CODEMSA">Code</option>
                          <option value="CODE_DND">Code Drag & Drop</option>
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
                  
                  <div className="flex items-center gap-4">
                    {/* Image Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowQuestionImage(!showQuestionImage)}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                        showQuestionImage ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                      }`}
                      title="Add image to question"
                    >
                      <Icon name="image" size="sm" />
                    </button>
                    
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
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text {watch("isRequired") && <span className="text-red-500">*</span>}
                  </label>
                  <Controller
                    name="text"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write your question here..."
                      />
                    )}
                  />
                  {showQuestionImage && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รูปภาพประกอบโจทย์ (ถ้ามี)
                      </label>
                      <ImageUpload
                        value={watch("imageUrl") || ""}
                        onChange={(url) => setValue("imageUrl", url)}
                        className="h-48 w-full md:w-1/2 lg:w-1/3"
                        placeholder="อัปโหลดรูปภาพโจทย์"
                      />
                    </div>
                  )}
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
                          <div key={field.id} className="flex flex-col gap-2">
                            <div className="flex items-start gap-3">
                              <div className="pt-2">
                                <input
                                  type={isMulti ? "checkbox" : "radio"}
                                  name="correctAnswer"
                                  checked={isChecked}
                                  onChange={handleSelect}
                                  className={`w-5 h-5 ${isMulti ? 'text-indigo-600 rounded' : 'text-indigo-600'} border-gray-300 focus:ring-indigo-500`}
                                />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="relative">
                                  <input
                                    {...register(`options.${index}.value`)}
                                    className={`w-full pr-10 pl-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                      isChecked ? "border-indigo-300 bg-indigo-50" : "border-gray-200"
                                    }`}
                                    placeholder={`Option ${index + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowOptionImages(prev => ({ ...prev, [index]: !prev[index] }))}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${
                                      showOptionImages[index] || watch(`optionImages.${index}.value`) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                    title="Add image to option"
                                  >
                                    <Icon name="image" size="sm" />
                                  </button>
                                </div>
                                {(showOptionImages[index] || watch(`optionImages.${index}.value`)) && (
                                  <ImageUpload
                                    value={watch(`optionImages.${index}.value`) || ""}
                                    onChange={(url) => setValue(`optionImages.${index}.value`, url)}
                                    className="h-32 w-full md:w-48 bg-white border-gray-200"
                                    placeholder={`รูปภาพตัวเลือก ${index + 1}`}
                                  />
                                )}
                              </div>
                              <div className="pt-1.5 flex items-center gap-1">
                                <button type="button" className="p-1 text-gray-300 hover:text-gray-400 cursor-move">
                                  <Icon name="menu" size="sm" />
                                </button>
                                {optionFields.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      removeOption(index);
                                      if (removeOptionImage) removeOptionImage(index);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                  >
                                    <Icon name="trash" size="sm" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {optionFields.length < 6 && (
                      <button
                        type="button"
                        onClick={() => {
                          appendOption({ value: "" });
                          if (appendOptionImage) appendOptionImage({ value: "" });
                        }}
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
                  <div className="space-y-6">
                    {/* Code Template */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code Template <span className="text-red-500">*</span>
                      </label>
                      
                      <textarea
                        {...register("codeTemplate")}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y bg-gray-50"
                        placeholder={`if (L < THRESHOLD && ___(1)___) {\n  motor(1, ___(2)___);\n}`}
                      />
                    </div>
                    
                    {/* Sub Questions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Sub Questions and Answers
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
                                placeholder="เติมโค้ดในหมายเลข (1)"
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
                  </div>
                )}

                {watchType === "CODE_DND" && (
                  <div className="space-y-6">
                    {/* Code Template */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code Template <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Write <code className="bg-gray-100 px-1 font-bold rounded">____</code> or <code className="bg-gray-100 px-1 font-bold rounded">[blank]</code> to create a blank space for the answer.
                      </p>
                      <textarea
                        {...register("codeTemplate")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue("codeTemplate", val, { shouldDirty: true });
                          // Auto extract blanks: matching ____ or ------- or [blankn] or blankn
                          const blankMatches = val.match(/(_{3,}|-{3,}|\\[blank\\d*\\]|blank\\d+)/gi) || [];
                          
                          const currentSubQs = getValues("subQuestions") || [];
                          // Adjust length
                          if (blankMatches.length > currentSubQs.length) {
                             // append
                             const toAdd = blankMatches.length - currentSubQs.length;
                             for (let i = 0; i < toAdd; i++) {
                               appendSubQ({ question: `ช่องว่างที่ ${currentSubQs.length + i + 1}`, answer: "" });
                             }
                          } else if (blankMatches.length < currentSubQs.length) {
                             // remove from end
                             const toRemove = currentSubQs.length - blankMatches.length;
                             for (let i = 0; i < toRemove; i++) {
                               removeSubQ(currentSubQs.length - 1 - i);
                             }
                          }
                          // Update questions names to reflect order
                          const updatedSubQs = getValues("subQuestions");
                          updatedSubQs.forEach((_: any, i: number) => {
                            setValue(`subQuestions.${i}.question`, `ช่องว่างที่ ${i + 1}`);
                          });
                        }}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y bg-gray-50 bg-white"
                        placeholder={`score = 60\n____ score < 50:\n    print("Fail")\n____:\n    print("____")`}
                      />
                    </div>
                    
                    {/* Sub Questions (Answers for blanks) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Answers for each blank
                      </label>
                      <div className="space-y-3">
                        {subQuestionFields.length === 0 && (
                          <div className="p-4 bg-gray-50 border border-gray-200 border-dashed rounded-lg text-center text-sm text-gray-500">
                            พิมพ์ <code className="bg-gray-200 px-1 rounded">____</code> ในโค้ด Template เพื่อสร้างช่่องคำตอบ
                          </div>
                        )}
                        {subQuestionFields.map((field, index) => (
                          <div key={field.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="mt-2 w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded text-sm font-bold">
                              {index + 1}
                            </span>
                            <div className="flex-1 space-y-2">
                              {/* Keep question hidden or use it as label */}
                              <input
                                type="hidden"
                                {...register(`subQuestions.${index}.question`)}
                              />
                              <input
                                {...register(`subQuestions.${index}.answer`)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder={`คำตอบที่ถูกต้องสำหรับช่องว่างที่ ${index + 1}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Drag Options (Including distractors) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        ตัวเลือกสำหรับลากวาง (เพิ่มตัวหลอกได้)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dragOptionFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <input
                              {...register(`dragOptions.${index}.value`)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="เช่น motor(1, 50)"
                            />
                            <button
                              type="button"
                              onClick={() => removeDragOption(index)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <Icon name="trash" size="sm" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => appendDragOption({ value: "" })}
                        className="mt-3 flex items-center gap-2 px-4 py-2 text-sm border border-dashed text-indigo-600 hover:bg-indigo-50 border-gray-300 rounded-lg hover:border-indigo-400 transition-colors"
                      >
                        <Icon name="plus" size="sm" />
                        เพิ่มตัวเลือกลากวาง
                      </button>
                    </div>
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

      {/* Settings Modal - Redesigned for Theme Consistency */}
      {showSettingsModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-scale-in">

      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-white rounded-t-2xl">
        <h2 className="text-base font-semibold text-gray-900">Exam Settings</h2>
        <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <Icon name="close" size="sm" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Cover */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Cover Image</p>
            <button
              onClick={() =>
                document.getElementById("cover-picker")?.classList.toggle("hidden")
              }
              className="text-xs text-indigo-600 font-bold"
            >
              Change
            </button>
          </div>

          <div className="aspect-[16/6] bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
            {coverImage ? (
              <img src={coverImage} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                No cover
              </div>
            )}
          </div>

          <div id="cover-picker" className="hidden mt-3 grid grid-cols-6 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            {[18,19,20,21,22,23,24,25].map((n) => {
              const img = `/image/cover-exam/${n}.png`;
              const isSelected = coverImage === img;
              return (
                <img
                  key={n}
                  src={img}
                  onClick={() => setCoverImage(img)}
                  className={`cursor-pointer rounded-md border-2 transition-all ${
                    isSelected ? "border-indigo-600 scale-90" : "border-transparent hover:scale-105"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Information</p>

          <input
            type="text"
            placeholder="Class (e.g. M.2/3)"
            value={classroom}
            onChange={(e) => setClassroom(e.target.value)}
            className="input"
          />

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input"
          />

          <textarea
            rows={3}
            placeholder="Instructions (one per line)"
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            className="input"
          />
        </div>

        {/* Config */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">Configuration</p>

          {/* Time */}
          <div>
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              value={timeLimitMinutes || ""}
              onChange={(e) =>
                setTimeLimitMinutes(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="input"
            />
          </div>

          {/* Exam Type */}
          <div>
            <label className="label">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="input"
            >
              <option value="general">Regular</option>
              <option value="pretest">Pre-test</option>
              <option value="posttest">Post-test</option>
            </select>
          </div>

          {(examType === "pretest" || examType === "posttest") && (
            <input
              type="text"
              placeholder="Pair ID"
              value={pairId}
              onChange={(e) => setPairId(e.target.value)}
              className="input"
            />
          )}
        </div>

        {/* Toggles */}
<div className="space-y-3">
  <p className="text-sm font-medium text-gray-700">Options</p>

  {[
    { label: "Active", state: isActive, set: setIsActive },
    { label: "Shuffle Questions", state: shuffleQuestions, set: setShuffleQuestions },
    { label: "Lock Screen", state: lockScreen, set: setLockScreen },
    { label: "Hide Exam", state: isHidden, set: setIsHidden },
  ].map((t, i) => (
    <div
      key={i}
      className="flex items-center justify-between py-2 border-b last:border-none"
    >
      <span className="text-sm text-gray-700">{t.label}</span>

      <button
        type="button"
        onClick={() => t.set(!t.state)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none ${
          t.state ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
            t.state ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </div>
  ))}
</div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t flex justify-end gap-2">
        <button
          onClick={() => setShowSettingsModal(false)}
          className="px-4 py-2 text-sm text-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={saveSettings}
          className="px-5 py-2 bg-[#B93D49] text-white text-sm rounded-lg"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
