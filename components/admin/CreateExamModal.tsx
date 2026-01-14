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
  const [newExamTimeLimit, setNewExamTimeLimit] = useState<number | null>(60);
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
      const response = await fetch("/api/exam-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newExamTitle.trim(),
          subject: newExamSubject.trim() || null,
          timeLimitMinutes: newExamTimeLimit,
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
          isActive: newExam.isActive,
          createdAt: newExam.createdAt,
          timeLimitMinutes: newExam.timeLimitMinutes,
          shuffleQuestions: false,
          lockScreen: false,
          scheduledStart: null,
          scheduledEnd: null,
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
        setNewExamTimeLimit(60);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative rounded-xl border border-border bg-card w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Create New Exam Set
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Exam Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Midterm Exam 1/2568"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={newExamSubject}
              onChange={(e) => setNewExamSubject(e.target.value)}
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
                value={newExamTimeLimit || ""}
                onChange={(e) => setNewExamTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                placeholder="60"
              />
              <span className="text-sm text-gray-500">
                {newExamTimeLimit ? `(${Math.floor(newExamTimeLimit / 60)} ชม. ${newExamTimeLimit % 60} นาที)` : "ไม่จำกัดเวลา"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !newExamTitle.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Icon name="spinner" size="sm" />
                Creating...
              </>
            ) : (
              <>
                <Icon name="plus" size="sm" />
                Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

