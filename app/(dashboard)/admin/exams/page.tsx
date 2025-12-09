"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

import Icon from "@/components/Icon";
import ShareModal from "@/components/ShareModal";
import QuestionAnalysis from "@/components/QuestionAnalysis";
import { useToast } from "@/components/Toast";

interface ExamSet {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  isActive: boolean;
  createdAt: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  timeLimitMinutes?: number | null;
  shuffleQuestions?: boolean;
  _count?: {
    questions: number;
    submissions: number;
  };
}

export default function ExamManagementPage() {
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamSubject, setNewExamSubject] = useState("");
  const [newExamTimeLimit, setNewExamTimeLimit] = useState<number | null>(60);
  const [isCreating, setIsCreating] = useState(false);
  
  // Share modal state
  const [shareModalExam, setShareModalExam] = useState<ExamSet | null>(null);
  
  // Edit modal state
  const [editModalExam, setEditModalExam] = useState<ExamSet | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editTimeLimit, setEditTimeLimit] = useState<number | null>(null);
  const [editShuffleQuestions, setEditShuffleQuestions] = useState(false);
  const [editIsActive, setEditIsActive] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Analytics modal state
  const [analyticsExamId, setAnalyticsExamId] = useState<string | null>(null);
  
  // Toast hook
  const toast = useToast();

  // Fetch exam sets
  const fetchExamSets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/exam-sets");
      if (response.ok) {
        const data = await response.json();
        setExamSets(data.examSets || []);
      }
    } catch (error) {
      console.error("Error fetching exam sets:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExamSets();
  }, [fetchExamSets]);

  // Create new exam set
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
        setShowCreateModal(false);
        setNewExamTitle("");
        setNewExamSubject("");
        setNewExamTimeLimit(60);
        await fetchExamSets();
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

  // Open edit modal
  const handleOpenEdit = (exam: ExamSet) => {
    setEditModalExam(exam);
    setEditTitle(exam.title);
    setEditSubject(exam.subject || "");
    setEditTimeLimit(exam.timeLimitMinutes || null);
    setEditShuffleQuestions(exam.shuffleQuestions || false);
    setEditIsActive(exam.isActive || false);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editModalExam || !editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/exam-sets/${editModalExam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          subject: editSubject.trim() || null,
          timeLimitMinutes: editTimeLimit,
          shuffleQuestions: editShuffleQuestions,
          isActive: editIsActive,
        }),
      });

      if (response.ok) {
        setEditModalExam(null);
        await fetchExamSets();
        toast.showToast("success", "บันทึกสำเร็จ");
      } else {
        toast.showToast("error", "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      toast.showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete exam set
  const handleDelete = async (examId: string, title: string) => {
    if (!confirm(`คุณต้องการลบชุดข้อสอบ "${title}" ใช่หรือไม่?\n\nคำเตือน: ข้อมูลทั้งหมดจะถูกลบถาวร`)) {
      return;
    }

    try {
      const response = await fetch(`/api/exam-sets/${examId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchExamSets();
        toast.showToast("success", "ลบชุดข้อสอบเรียบร้อย");
      } else {
        toast.showToast("error", "เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.showToast("error", "เกิดข้อผิดพลาด");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Open share modal
  const handleShare = (exam: ExamSet) => {
    setShareModalExam(exam);
  };

  // Save scheduling settings
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
        // Update local state
        setExamSets((prev) =>
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
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Icon name="settings" size="lg" className="text-indigo-600" />
              การจัดการข้อสอบ
            </h1>
            <p className="text-sm text-gray-500 mt-1">สร้าง แก้ไข และจัดการชุดข้อสอบ</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Icon name="plus" size="sm" />
            สร้างชุดข้อสอบใหม่
          </button>
        </div>

        {/* Exam List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-12">
              <Icon name="spinner" size="lg" className="text-indigo-600" />
              <span className="text-gray-500">กำลังโหลด...</span>
            </div>
          ) : examSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Icon name="folder" size="xl" className="mb-3" />
              <p className="mb-2">ยังไม่มีชุดข้อสอบ</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-indigo-600 hover:underline text-sm"
              >
                สร้างชุดข้อสอบแรก
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      ชุดข้อสอบ
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      คำถาม
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      ผู้สอบ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      สร้างเมื่อ
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {examSets.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{exam.title}</p>
                          {exam.subject && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              วิชา: {exam.subject}
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
                              เปิด
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              ปิด
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {exam._count?.questions || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {exam._count?.submissions || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(exam.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(exam)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="ตั้งค่า"
                          >
                            <Icon name="settings" size="sm" />
                          </button>
                          <button
                            onClick={() => setAnalyticsExamId(exam.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="วิเคราะห์รายข้อ"
                            disabled={!exam._count?.submissions}
                          >
                            <Icon name="chart" size="sm" />
                          </button>
                          <button
                            onClick={() => handleShare(exam)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="แชร์ลิงก์"
                          >
                            <Icon name="share" size="sm" />
                          </button>
                          <Link
                            href={`/admin/exams/${exam.id}/edit`}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="แก้ไขคำถาม"
                          >
                            <Icon name="edit" size="sm" />
                          </Link>
                          <button
                            onClick={() => handleDelete(exam.id, exam.title)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
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
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-md w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              สร้างชุดข้อสอบใหม่
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ชื่อชุดข้อสอบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="เช่น สอบกลางภาค 1/2568"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  วิชา (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={newExamSubject}
                  onChange={(e) => setNewExamSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="เช่น คณิตศาสตร์"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  เวลาทำข้อสอบ (นาที)
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
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !newExamTitle.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Icon name="spinner" size="sm" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Icon name="plus" size="sm" />
                    สร้าง
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditModalExam(null)}
          />
          <div className="relative bg-white rounded-lg shadow-md w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              <Icon name="settings" size="sm" className="inline mr-2 text-gray-600" />
              ตั้งค่าข้อสอบ
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ชื่อชุดข้อสอบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  วิชา (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="เช่น คณิตศาสตร์"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  เวลาทำข้อสอบ (นาที)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={editTimeLimit || ""}
                    onChange={(e) => setEditTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                    placeholder="60"
                  />
                  <span className="text-sm text-gray-500">
                    {editTimeLimit ? `(${Math.floor(editTimeLimit / 60)} ชม. ${editTimeLimit % 60} นาที)` : "ไม่จำกัดเวลา"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">ปล่อยว่างไว้ = ไม่จำกัดเวลา</p>
              </div>
              
              {/* Shuffle Questions Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">สลับลำดับข้อสอบ</p>
                  <p className="text-xs text-gray-500">ลำดับข้อสอบจะสุ่มใหม่สำหรับนักเรียนแต่ละคน</p>
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

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">เปิดใช้งานข้อสอบ</p>
                  <p className="text-xs text-gray-500">นักเรียนจะเห็นข้อสอบนี้เมื่อเปิดใช้งาน</p>
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
                onClick={() => setEditModalExam(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editTitle.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEdit ? (
                  <>
                    <Icon name="spinner" size="sm" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Icon name="check-circle" size="sm" />
                    บันทึก
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

