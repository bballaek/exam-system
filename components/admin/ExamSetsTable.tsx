"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import ShareModal from "@/components/ShareModal";
import QuestionAnalysis from "@/components/QuestionAnalysis";
import { useToast } from "@/components/Toast";
import type { ExamSetWithStats } from "@/lib/data/exam-sets";

interface ExamSetsTableProps {
  examSets: ExamSetWithStats[];
  onEdit?: (exam: ExamSetWithStats) => void;
}

export default function ExamSetsTable({ examSets, onEdit }: ExamSetsTableProps) {
  const [currentExamSets, setCurrentExamSets] = useState(examSets);
  const [shareModalExam, setShareModalExam] = useState<ExamSetWithStats | null>(null);
  const [analyticsExamId, setAnalyticsExamId] = useState<string | null>(null);
  const toast = useToast();

  // Update when examSets prop changes
  useEffect(() => {
    setCurrentExamSets(examSets);
  }, [examSets]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (examId: string, title: string) => {
    if (!confirm(`คุณต้องการลบชุดข้อสอบ "${title}" ใช่หรือไม่?\n\nคำเตือน: ข้อมูลทั้งหมดจะถูกลบถาวร`)) {
      return;
    }

    try {
      const response = await fetch(`/api/exam-sets/${examId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCurrentExamSets((prev) => prev.filter((e) => e.id !== examId));
        toast.showToast("success", "ลบชุดข้อสอบเรียบร้อย");
      } else {
        toast.showToast("error", "เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.showToast("error", "เกิดข้อผิดพลาด");
    }
  };

  const handleSaveSettings = async (settings: {
    scheduledStart: string | null;
    scheduledEnd: string | null;
  }) => {
    if (!shareModalExam) return;

    try {
      const response = await fetch(`/api/exam-sets/${shareModalExam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setCurrentExamSets((prev) =>
          prev.map((e) =>
            e.id === shareModalExam.id
              ? { ...e, ...settings }
              : e
          )
        );
        setShareModalExam(null);
        toast.showToast("success", "บันทึกการตั้งค่าสำเร็จ");
      } else {
        toast.showToast("error", "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.showToast("error", "เกิดข้อผิดพลาด");
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {currentExamSets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Icon name="folder" size="xl" className="mb-3" />
            <p className="mb-2">No exam sets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Exam Set
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Questions
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Exam Takers
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Manage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentExamSets.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{exam.title}</p>
                        {exam.subject && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Subject: {exam.subject}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        exam.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {exam.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Open
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            Close
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {exam.questionCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {exam.submissionCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(exam.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {onEdit ? (
                          <button
                            onClick={() => onEdit(exam)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Settings"
                          >
                            <Icon name="settings" size="sm" />
                          </button>
                        ) : (
                          <Link
                            href={`/admin/exams/${exam.id}/edit`}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Settings"
                          >
                            <Icon name="settings" size="sm" />
                          </Link>
                        )}
                        <button
                          onClick={() => setAnalyticsExamId(exam.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Analytics"
                          disabled={!exam.submissionCount}
                        >
                          <Icon name="chart" size="sm" />
                        </button>
                        <button
                          onClick={() => setShareModalExam(exam)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Share Link"
                        >
                          <Icon name="share" size="sm" />
                        </button>
                        <Link
                          href={`/admin/exams/${exam.id}/edit`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Questions"
                        >
                          <Icon name="edit" size="sm" />
                        </Link>
                        <button
                          onClick={() => handleDelete(exam.id, exam.title)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Icon name="trash" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={!!shareModalExam}
        onClose={() => setShareModalExam(null)}
        examId={shareModalExam?.id || ""}
        examTitle={shareModalExam?.title || ""}
        currentSettings={{
          scheduledStart: shareModalExam?.scheduledStart,
          scheduledEnd: shareModalExam?.scheduledEnd,
        }}
        onSaveSettings={handleSaveSettings}
      />

      {/* Question Analysis Modal */}
      <QuestionAnalysis
        examSetId={analyticsExamId || ""}
        isOpen={!!analyticsExamId}
        onClose={() => setAnalyticsExamId(null)}
      />
    </>
  );
}

