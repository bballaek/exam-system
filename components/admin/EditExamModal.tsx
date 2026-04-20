"use client";

import { useState, useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";
import type { ExamSetWithStats } from "@/lib/data/exam-sets";

interface EditExamModalProps {
  exam: ExamSetWithStats | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COVER_IMAGES = [18, 19, 20, 21, 22, 23, 24, 25];

export default function EditExamModal({ exam, onClose, onSuccess }: EditExamModalProps) {
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editClassroom, setEditClassroom] = useState("");
  const [editTimeLimit, setEditTimeLimit] = useState<number | null>(null);
  const [editInstructions, setEditInstructions] = useState("");
  const [editShuffleQuestions, setEditShuffleQuestions] = useState(false);
  const [editLockScreen, setEditLockScreen] = useState(false);
  const [editIsActive, setEditIsActive] = useState(false);
  const [editIsHidden, setEditIsHidden] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState<string | null>(null);
  const [editExamType, setEditExamType] = useState("general");
  const [editPairId, setEditPairId] = useState("");
  const [originalIsActive, setOriginalIsActive] = useState(false);
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Animate in
  useEffect(() => {
    if (exam) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [exam]);

  useEffect(() => {
    if (exam) {
      setEditTitle(exam.title);
      setEditSubject(exam.subject || "");
      setEditClassroom(exam.classroom || "");
      setEditTimeLimit(exam.timeLimitMinutes || null);
      setEditInstructions(Array.isArray(exam.instructions) ? exam.instructions.join('\n') : "");
      setEditShuffleQuestions(exam.shuffleQuestions ?? false);
      setEditLockScreen(exam.lockScreen ?? false);
      const initialIsActive = exam.isActive === true;
      const initialIsHidden = exam.isHidden === true;
      setEditIsActive(initialIsActive);
      setEditIsHidden(initialIsHidden);
      setEditCoverImage(exam.coverImage || null);
      setEditExamType(exam.examType || "general");
      setEditPairId(exam.pairId || "");
      setOriginalIsActive(initialIsActive);
      setOriginalIsHidden(initialIsHidden);
      setShowCoverPicker(false);
    } else {
      setEditTitle("");
      setEditSubject("");
      setEditClassroom("");
      setEditTimeLimit(null);
      setEditInstructions("");
      setEditShuffleQuestions(false);
      setEditLockScreen(false);
      setEditIsActive(false);
      setEditIsHidden(false);
      setEditCoverImage(null);
      setEditExamType("general");
      setEditPairId("");
      setOriginalIsActive(false);
      setOriginalIsHidden(false);
    }
  }, [exam]);

  if (!exam) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      const instructionsArray = editInstructions.trim()
        ? editInstructions.trim().split('\n').filter(line => line.trim())
        : null;

      const updateData: Record<string, any> = {
        title: editTitle.trim(),
        subject: editSubject.trim() || null,
        classroom: editClassroom.trim() || null,
        timeLimitMinutes: editTimeLimit,
        instructions: instructionsArray,
        shuffleQuestions: editShuffleQuestions,
        lockScreen: editLockScreen,
        coverImage: editCoverImage,
        examType: editExamType,
        pairId: editPairId || null,
      };
      
      if (editIsActive !== originalIsActive) {
        updateData.isActive = editIsActive;
        if (editIsActive) {
          updateData.isHidden = false;
        }
      }
      
      if (!editIsActive && editIsHidden !== originalIsHidden) {
        updateData.isHidden = editIsHidden;
      }

      const response = await fetch(`/api/exam-sets/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        onSuccess();
        handleClose();
        toast.showToast("success", "บันทึกสำเร็จ");
      } else {
        let errorMessage = "เกิดข้อผิดพลาดในการบันทึก";
        try {
          const errorData = await response.json();
          if (errorData.details && typeof errorData.details === 'string' && !errorData.details.includes("Please run:")) {
            errorMessage = errorData.details;
          } else if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.message && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Ignore parse errors
        }
        toast.showToast("error", errorMessage);
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      toast.showToast("error", errorMessage);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const toggleItems = [
    {
      label: "เปิดให้สอบ",
      desc: "นักเรียนสามารถเข้าทำข้อสอบได้",
      state: editIsActive,
      set: (val: boolean) => {
        setEditIsActive(val);
        if (val) setEditIsHidden(false);
      },
      color: "green",
    },
    {
      label: "สลับลำดับข้อสอบ",
      desc: "แต่ละคนจะเห็นข้อสอบคนละลำดับ",
      state: editShuffleQuestions,
      set: setEditShuffleQuestions,
      color: "indigo",
    },
    {
      label: "ล็อกหน้าจอ",
      desc: "ป้องกันการสลับหน้าจอระหว่างสอบ",
      state: editLockScreen,
      set: setEditLockScreen,
      color: "amber",
    },
    {
      label: "ซ่อนข้อสอบ",
      desc: "ซ่อนจากหน้ารวม (ใช้ได้เมื่อปิดสอบ)",
      state: editIsHidden,
      set: setEditIsHidden,
      color: "gray",
      disabled: editIsActive,
    },
  ];

  const toggleColorMap: Record<string, { active: string; bg: string }> = {
    green: { active: "bg-green-500", bg: "bg-green-500/10" },
    indigo: { active: "bg-indigo-500", bg: "bg-indigo-500/10" },
    amber: { active: "bg-amber-500", bg: "bg-amber-500/10" },
    gray: { active: "bg-gray-400", bg: "bg-gray-400/10" },
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative w-full sm:w-[480px] h-full bg-white flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleClose}
              className="p-1.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Icon name="arrow-left" size="sm" className="text-gray-500" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-gray-900 truncate">
                Exam Settings
              </h2>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {exam.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden lg:flex"
          >
            <Icon name="close" size="sm" className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Cover Image */}
          <div className="px-5 pt-5 pb-4">
            <div className="relative aspect-[16/6] bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group cursor-pointer"
                 onClick={() => setShowCoverPicker(!showCoverPicker)}>
              {editCoverImage ? (
                <img src={editCoverImage} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-1">
                  <Icon name="image" size="md" />
                  <span className="text-xs">Click to set cover</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full">
                  Change
                </span>
              </div>
              {editCoverImage && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditCoverImage(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <Icon name="close" size="xs" />
                </button>
              )}
            </div>

            {showCoverPicker && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
                <div className="grid grid-cols-4 gap-2">
                  {COVER_IMAGES.map((n) => {
                    const img = `/image/cover-exam/${n}.png`;
                    const isSelected = editCoverImage === img;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => { setEditCoverImage(img); setShowCoverPicker(false); }}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt={`Cover ${n}`} />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                            <Icon name="check-circle" size="sm" className="text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-5" />

          {/* Information Section */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Information</p>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                ชื่อชุดข้อสอบ <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                placeholder="e.g. สอบกลางภาค 1/2568"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ชั้นเรียน</label>
                <input
                  type="text"
                  value={editClassroom}
                  onChange={(e) => setEditClassroom(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="e.g. ม.1/1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">วิชา</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="e.g. คณิตศาสตร์"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">คำชี้แจง</label>
              <textarea
                rows={3}
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                placeholder="กรอกคำชี้แจง แต่ละบรรทัดแยกข้อ"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-5" />

          {/* Configuration Section */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuration</p>

            {/* Duration */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">เวลาสอบ (นาที)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={editTimeLimit || ""}
                  onChange={(e) =>
                    setEditTimeLimit(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-28 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="60"
                />
                <span className="text-xs text-gray-400">
                  {editTimeLimit
                    ? `${Math.floor(editTimeLimit / 60)} ชม. ${editTimeLimit % 60} นาที`
                    : "ไม่จำกัดเวลา"}
                </span>
              </div>
            </div>

            {/* Exam Type */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">ประเภทข้อสอบ</label>
              <div className="flex gap-2">
                {[
                  { value: "general", label: "ทั่วไป" },
                  { value: "pretest", label: "Pre-test" },
                  { value: "posttest", label: "Post-test" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEditExamType(type.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      editExamType === type.value
                        ? "bg-gray-900 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pair ID - conditional */}
            {(editExamType === "pretest" || editExamType === "posttest") && (
              <div className="animate-fade-in">
                <label className="text-xs text-gray-500 mb-1 block">Pair ID (สำหรับวิเคราะห์)</label>
                <input
                  type="text"
                  placeholder="e.g. unit-1-chapter-2"
                  value={editPairId}
                  onChange={(e) => setEditPairId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-5" />

          {/* Toggles Section */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Options</p>
            <div className="space-y-1">
              {toggleItems.map((t, i) => {
                const colors = toggleColorMap[t.color] || toggleColorMap.gray;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !t.disabled && t.set(!t.state)}
                    disabled={t.disabled}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      t.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : t.state
                          ? `${colors.bg} hover:opacity-80`
                          : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-medium ${t.state ? "text-gray-900" : "text-gray-700"}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    </div>
                    <div
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ml-3 ${
                        t.state ? colors.active : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          t.state ? "translate-x-[18px]" : "translate-x-[2px]"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom spacer for safe area */}
          <div className="h-4" />
        </div>

        {/* Footer - Save / Cancel */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={isSavingEdit || !editTitle.trim()}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSavingEdit ? (
              <>
                <Icon name="spinner" size="xs" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="check-circle" size="xs" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
