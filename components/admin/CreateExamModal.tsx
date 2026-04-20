"use client";

import { useState } from "react";
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

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newExamTitle.trim()) {
      toast.showToast("warning", "กรุณากรอกชื่อชุดข้อสอบ");
      return;
    }

    setIsCreating(true);
    try {
      const instructionsArray = newExamInstructions.trim()
        ? newExamInstructions.trim().split('\n').filter(line => line.trim())
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

      if (response.ok) {
        const newExam = await response.json();
        // Transform to match ExamSetWithStats format
        const formattedExam: ExamSetWithStats = {
          id: newExam.id,
          title: newExam.title,
          description: newExam.description,
          subject: newExam.subject,
          classroom: newExam.classroom ?? null,
          isActive: newExam.isActive,
          isHidden: newExam.isHidden ?? false,
          createdAt: newExam.createdAt,
          timeLimitMinutes: newExam.timeLimitMinutes,
          shuffleQuestions: false,
          lockScreen: false,
          scheduledStart: null,
          scheduledEnd: null,
          instructions: Array.isArray(newExam.instructions) ? newExam.instructions : null,
          coverImage: newExam.coverImage ?? null,
          questionCount: 0,
          submissionCount: 0,
          questionTypeCounts: {
            CHOICE: 0,
            SHORT: 0,
            CODEMSA: 0,
            TRUE_FALSE: 0,
          },
          totalPoints: 0,
        };
        
        onSuccess(formattedExam);
        setNewExamTitle("");
        setNewExamSubject("");
        setNewExamClassroom("");
        setNewExamTimeLimit(60);
        setNewExamInstructions("");
        onClose();
      } else {
        toast.showToast("error", "เกิดข้อผิดพลาดในการสร้างชุดข้อสอบ");
      }
    } catch (error) {
      console.error("Error creating exam set:", error);
      toast.showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-base font-semibold text-gray-900">
            Create New Exam Set
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="label">
              Exam Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              className="input"
              placeholder="e.g. Midterm Exam 1/2568"
              autoFocus
            />
          </div>

          <div>
            <label className="label">
              Class (Optional)
            </label>
            <input
              type="text"
              value={newExamClassroom}
              onChange={(e) => setNewExamClassroom(e.target.value)}
              className="input"
              placeholder="e.g. ม.1/1, ม.4/2"
            />
          </div>

          <div>
            <label className="label">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={newExamSubject}
              onChange={(e) => setNewExamSubject(e.target.value)}
              className="input"
              placeholder="e.g. Math"
            />
          </div>

          <div>
            <label className="label">
              Exam Time (Minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={300}
                value={newExamTimeLimit || ""}
                onChange={(e) => setNewExamTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                className="input w-32"
                placeholder="60"
              />
              <span className="text-xs text-gray-500">
                {newExamTimeLimit ? `(${Math.floor(newExamTimeLimit / 60)} ชม. ${newExamTimeLimit % 60} นาที)` : "ไม่จำกัดเวลา"}
              </span>
            </div>
          </div>

          <div>
            <label className="label">
              คำชี้แจง (Optional)
            </label>
            <textarea
              value={newExamInstructions}
              onChange={(e) => setNewExamInstructions(e.target.value)}
              className="input min-h-[100px] resize-y"
              placeholder="กรอกคำชี้แจงแต่ละบรรทัด&#10;หากไม่กรอก จะใช้คำชี้แจงพื้นฐาน"
              rows={4}
            />
            <p className="text-[10px] text-gray-400 mt-1.5 italic">
              * แต่ละบรรทัดจะเป็นคำชี้แจงหนึ่งข้อ
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !newExamTitle.trim()}
            className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
          >
            {isCreating ? (
              <>
                <Icon name="spinner" size="xs" className="animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

