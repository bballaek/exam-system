"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";
import type { ExamSetWithStats } from "@/lib/data/exam-sets";

interface EditExamModalProps {
  exam: ExamSetWithStats | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditExamModal({ exam, onClose, onSuccess }: EditExamModalProps) {
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editTimeLimit, setEditTimeLimit] = useState<number | null>(null);
  const [editInstructions, setEditInstructions] = useState("");
  const [editShuffleQuestions, setEditShuffleQuestions] = useState(false);
  const [editLockScreen, setEditLockScreen] = useState(false);
  const [editIsActive, setEditIsActive] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (exam) {
      setEditTitle(exam.title);
      setEditSubject(exam.subject || "");
      setEditTimeLimit(exam.timeLimitMinutes || null);
      setEditInstructions(Array.isArray(exam.instructions) ? exam.instructions.join('\n') : "");
      setEditShuffleQuestions(exam.shuffleQuestions || false);
      setEditLockScreen(exam.lockScreen || false);
      setEditIsActive(exam.isActive || false);
    }
  }, [exam]);

  if (!exam) return null;

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      const instructionsArray = editInstructions.trim()
        ? editInstructions.trim().split('\n').filter(line => line.trim())
        : null;

      const response = await fetch(`/api/exam-sets/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          subject: editSubject.trim() || null,
          timeLimitMinutes: editTimeLimit,
          instructions: instructionsArray,
          shuffleQuestions: editShuffleQuestions,
          lockScreen: editLockScreen,
          isActive: editIsActive,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative rounded-xl border border-border bg-card w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          <Icon name="settings" size="sm" className="inline mr-2 text-gray-600" />
          Exam Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Exam Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              className="w-full px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Math"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Exam Time (Minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={300}
                value={editTimeLimit || ""}
                onChange={(e) => setEditTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                className="w-24 px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                placeholder="60"
              />
              <span className="text-sm text-gray-500">
                {editTimeLimit ? `(${Math.floor(editTimeLimit / 60)} ชม. ${editTimeLimit % 60} นาที)` : "ไม่จำกัดเวลา"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">No time limit</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              คำชี้แจง (Optional)
            </label>
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              className="w-full px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[100px]"
              placeholder="กรอกคำชี้แจงแต่ละบรรทัด&#10;หากไม่กรอก จะใช้คำชี้แจงพื้นฐาน"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              แต่ละบรรทัดจะเป็นคำชี้แจงหนึ่งข้อ หากไม่กรอกจะใช้คำชี้แจงพื้นฐาน
            </p>
          </div>
          
          {/* Shuffle Questions Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-gray-700">Shuffle</p>
              <p className="text-xs text-gray-500">Questions will be shuffled for each student</p>
            </div>
            <button
              type="button"
              onClick={() => setEditShuffleQuestions(!editShuffleQuestions)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                editShuffleQuestions ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  editShuffleQuestions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Lock Screen Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-gray-700">Lock screen</p>
              <p className="text-xs text-gray-500">Prevent students from leaving the screen while taking the exam</p>
            </div>
            <button
              type="button"
              onClick={() => setEditLockScreen(!editLockScreen)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                editLockScreen ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  editLockScreen ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-gray-700">Active</p>
              <p className="text-xs text-gray-500">Students will see this exam when it is active</p>
            </div>
            <button
              type="button"
              onClick={() => setEditIsActive(!editIsActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                editIsActive ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  editIsActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={isSavingEdit || !editTitle.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingEdit ? (
              <>
                <Icon name="spinner" size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="check-circle" size="sm" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



