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
  const toast = useToast();

  useEffect(() => {
    if (exam) {
      setEditTitle(exam.title);
      setEditSubject(exam.subject || "");
      setEditClassroom((exam as any).classroom || "");
      setEditTimeLimit(exam.timeLimitMinutes || null);
      setEditInstructions(Array.isArray(exam.instructions) ? exam.instructions.join('\n') : "");
      setEditShuffleQuestions(exam.shuffleQuestions ?? false);
      setEditLockScreen(exam.lockScreen ?? false);
      // Use explicit boolean check to ensure false is preserved
      const initialIsActive = exam.isActive === true;
      const initialIsHidden = (exam as any).isHidden === true;
      setEditIsActive(initialIsActive);
      setEditIsHidden(initialIsHidden);
      setEditCoverImage(exam.coverImage || null);
      setEditExamType(exam.examType || "general");
      setEditPairId(exam.pairId || "");
      setOriginalIsActive(initialIsActive);
      setOriginalIsHidden(initialIsHidden);
    } else {
      // Reset all states when exam is null
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

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      const instructionsArray = editInstructions.trim()
        ? editInstructions.trim().split('\n').filter(line => line.trim())
        : null;

      // Only send isActive if it has changed
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
      
      // Only include isActive if it has changed from original
      if (editIsActive !== originalIsActive) {
        updateData.isActive = editIsActive;
        // Reset isHidden to false when activating exam
        if (editIsActive) {
          updateData.isHidden = false;
        }
      }
      
      // Only include isHidden if it has changed and exam is not active
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-scale-in">

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white rounded-t-2xl">
          <h2 className="text-base font-semibold text-gray-900">Exam Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Cover Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">Cover Image</p>
              <button
                onClick={() =>
                  document.getElementById("dashboard-cover-picker")?.classList.toggle("hidden")
                }
                className="text-xs text-indigo-600 font-bold"
              >
                Change
              </button>
            </div>

            <div className="relative aspect-[16/6] bg-gray-100 rounded-xl overflow-hidden border border-gray-100 group">
              {editCoverImage ? (
                <img src={editCoverImage} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-xs text-gray-400 gap-1.5">
                  <Icon name="image" size="sm" />
                  <span>No cover set</span>
                </div>
              )}
              {editCoverImage && (
                <button 
                  onClick={() => setEditCoverImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="close" size="xs" />
                </button>
              )}
            </div>

            <div id="dashboard-cover-picker" className="hidden mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
              <div className="grid grid-cols-6 gap-2">
                {[18, 19, 20, 21, 22, 23, 24, 25].map((n) => {
                  const img = `/image/cover-exam/${n}.png`;
                  const isSelected = editCoverImage === img;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditCoverImage(img)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected ? "border-indigo-600 scale-90" : "border-transparent hover:scale-105"
                      }`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Cover ${n}`} />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <Icon name="check-circle" size="xs" className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Information</p>

            <input
              type="text"
              placeholder="Exam Set Name *"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input"
            />

            <input
              type="text"
              placeholder="Class (e.g. M.2/3)"
              value={editClassroom}
              onChange={(e) => setEditClassroom(e.target.value)}
              className="input"
            />

            <input
              type="text"
              placeholder="Subject"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              className="input"
            />

            <textarea
              rows={3}
              placeholder="Instructions (one per line)"
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
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
                value={editTimeLimit || ""}
                onChange={(e) =>
                  setEditTimeLimit(
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
                value={editExamType}
                onChange={(e) => setEditExamType(e.target.value)}
                className="input"
              >
                <option value="general">Regular Exam</option>
                <option value="pretest">Pre-test</option>
                <option value="posttest">Post-test</option>
              </select>
            </div>

            {(editExamType === "pretest" || editExamType === "posttest") && (
              <div className="animate-fade-in">
                <label className="label">Pair ID (for analysis)</label>
                <input
                  type="text"
                  placeholder="e.g. unit-1-chapter-2"
                  value={editPairId}
                  onChange={(e) => setEditPairId(e.target.value)}
                  className="input"
                />
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Options</p>

            {[
              { label: "Active", state: editIsActive, set: (val: boolean) => {
                setEditIsActive(val);
                if (val) setEditIsHidden(false);
              } },
              { label: "Shuffle Questions", state: editShuffleQuestions, set: setEditShuffleQuestions },
              { label: "Lock Screen", state: editLockScreen, set: setEditLockScreen },
              { label: "Hide Exam", state: editIsHidden, set: setEditIsHidden },
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
        <div className="px-6 py-4 border-t flex justify-end gap-2 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={isSavingEdit || !editTitle.trim()}
            className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
          >
            {isSavingEdit ? (
              <>
                <Icon name="spinner" size="xs" className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



