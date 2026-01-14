"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ExamSetsTable from "./ExamSetsTable";
import CreateExamModal from "./CreateExamModal";
import EditExamModal from "./EditExamModal";
import type { ExamSetWithStats } from "@/lib/data/exam-sets";

interface ExamManagementPageClientProps {
  initialExamSets: ExamSetWithStats[];
}

export default function ExamManagementPageClient({ initialExamSets }: ExamManagementPageClientProps) {
  const [examSets, setExamSets] = useState(initialExamSets);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalExam, setEditModalExam] = useState<ExamSetWithStats | null>(null);

  const handleCreateSuccess = (newExam: ExamSetWithStats) => {
    setExamSets((prev) => [newExam, ...prev]);
    setShowCreateModal(false);
  };

  const handleEditSuccess = async () => {
    // Refetch exam sets with cache bypass
    const response = await fetch("/api/exam-sets", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    if (response.ok) {
      const data = await response.json();
      setExamSets(data.examSets || []);
    }
  };

  const handleOpenEdit = (exam: ExamSetWithStats) => {
    setEditModalExam(exam);
  };

  return (
    <>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Icon name="settings" size="lg" className="text-indigo-600" />
              Manage Exam Sets
            </h1>
            <p className="text-sm text-gray-500 mt-1">Create, edit, and manage exam sets</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Icon name="plus" size="sm" />
            Create New Exam Set
          </button>
        </div>

        {/* Exam List */}
        <ExamSetsTable examSets={examSets} onEdit={handleOpenEdit} />
      </div>

      {/* Create Modal */}
      <CreateExamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      <EditExamModal
        exam={editModalExam}
        onClose={() => setEditModalExam(null)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}



