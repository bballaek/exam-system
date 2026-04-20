"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";
import type { ExamSetWithStats } from "@/lib/data/exam-sets";

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newExam: ExamSetWithStats) => void;
}

export default function CreateExamModal({ isOpen, onClose, onSuccess }: CreateExamModalProps) {
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamSubject, setNewExamSubject] = useState("");
  const [newExamClassroom, setNewExamClassroom] = useState("");
  const [newExamTimeLimit, setNewExamTimeLimit] = useState<number | null>(60);
  const [newExamInstructions, setNewExamInstructions] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  // Animate in/out
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const resetForm = () => {
    setNewExamTitle("");
    setNewExamSubject("");
    setNewExamClassroom("");
    setNewExamTimeLimit(60);
    setNewExamInstructions("");
  };

  const handleCreate = async () => {
    if (!newExamTitle.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const instructionsArray = newExamInstructions.trim()
        ? newExamInstructions.trim().split("\n").filter((line) => line.trim())
        : null;

      const response = await fetch("/api/exam-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newExamTitle.trim(),
          subject: newExamSubject.trim() || null,
          classroom: newExamClassroom.trim() || null,
          timeLimitMinutes: newExamTimeLimit,
          instructions: instructionsArray,
        }),
      });

      if (!response.ok) {
        toast.showToast("error", "เกิดข้อผิดพลาดในการสร้างชุดข้อสอบ");
        return;
      }

      const created = await response.json();

      const newExam: ExamSetWithStats = {
        id: String(created.id),
        title: String(created.title ?? newExamTitle.trim()),
        description: created.description ?? null,
        subject: created.subject ?? (newExamSubject.trim() || null),
        classroom: created.classroom ?? (newExamClassroom.trim() || null),
        isActive: Boolean(created.isActive ?? false),
        isHidden: Boolean(created.isHidden ?? false),
        createdAt: String(created.createdAt ?? new Date().toISOString()),
        timeLimitMinutes: created.timeLimitMinutes ?? newExamTimeLimit,
        shuffleQuestions: Boolean(created.shuffleQuestions ?? false),
        lockScreen: Boolean(created.lockScreen ?? false),
        scheduledStart: created.scheduledStart ?? null,
        scheduledEnd: created.scheduledEnd ?? null,
        instructions: Array.isArray(created.instructions) ? created.instructions : instructionsArray,
        coverImage: created.coverImage ?? null,
        examType: created.examType ?? null,
        pairId: created.pairId ?? null,
        questionCount: 0,
        submissionCount: 0,
        questionTypeCounts: { CHOICE: 0, SHORT: 0, CODEMSA: 0, TRUE_FALSE: 0 },
        totalPoints: 0,
      };

      onSuccess(newExam);
      resetForm();
      handleClose();
      toast.showToast("success", "สร้างชุดข้อสอบสำเร็จ");
    } catch (error) {
      console.error("Error creating exam set:", error);
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      toast.showToast("error", errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

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
                Create New Exam Set
              </h2>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                สร้างชุดข้อสอบใหม่
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto w-full">
          {/* Info */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">General Information</p>
            
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Exam Set Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                placeholder="e.g. Midterm Exam 1/2568"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Class (Optional)
                </label>
                <input
                  type="text"
                  value={newExamClassroom}
                  onChange={(e) => setNewExamClassroom(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="e.g. ม.1/1, ม.4/2"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={newExamSubject}
                  onChange={(e) => setNewExamSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="e.g. Math"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-5" />

          {/* Configuration */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Settings & Configuration</p>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Exam Time (Minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={newExamTimeLimit || ""}
                  onChange={(e) => setNewExamTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-28 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="60"
                />
                <span className="text-xs text-gray-400">
                  {newExamTimeLimit ? `${Math.floor(newExamTimeLimit / 60)} ชม. ${newExamTimeLimit % 60} นาที` : "ไม่จำกัดเวลา"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                คำชี้แจง (Optional)
              </label>
              <textarea
                value={newExamInstructions}
                onChange={(e) => setNewExamInstructions(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all min-h-[100px] resize-y"
                placeholder="กรอกคำชี้แจงแต่ละบรรทัด&#10;หากไม่กรอก จะใช้คำชี้แจงพื้นฐาน"
                rows={4}
              />
              <p className="text-[10px] text-gray-400 mt-1 italic">
                * แต่ละบรรทัดจะเป็นคำชี้แจงหนึ่งข้อ
              </p>
            </div>
          </div>
          
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !newExamTitle.trim()}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isCreating ? (
              <>
                <Icon name="spinner" size="xs" />
                Creating...
              </>
            ) : (
              <>
                <Icon name="plus" size="xs" />
                Create Exam
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

