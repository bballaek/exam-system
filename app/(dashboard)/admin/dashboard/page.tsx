"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import { useExamSets } from "@/lib/hooks/useExamSets";
import { useSubmissions } from "@/lib/hooks/useSubmissions";
import {
  StatCard,
  ScoreDistributionChart,
  PassFailPieChart,
  SubmissionsTable,
  DashboardFilters,
  DashboardSkeleton,
  EmptyState,
} from "@/components/dashboard";
import type { Submission } from "@/components/dashboard/SubmissionsTable";
import type { ExamSet } from "@/components/dashboard/DashboardFilters";

const ROWS_PER_PAGE = 20;

export default function AdminDashboardPage() {
  // Filters state
  const [selectedExamSetId, setSelectedExamSetId] = useState<string>("");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "score" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // SWR hooks for data fetching with caching
  const { examSets, isLoading: isLoadingExams, mutate: mutateExams } = useExamSets();
  const { submissions: rawSubmissions, isLoading: isLoadingSubmissions, mutate: mutateSubmissions } = useSubmissions(selectedExamSetId || undefined);

  const isLoading = isLoadingExams || isLoadingSubmissions;

  // Transform exam sets for filter component
  const examSetsForFilter: ExamSet[] = useMemo(() => {
    return examSets.map(exam => ({
      id: exam.id,
      title: exam.title,
      isActive: exam.isActive,
      questionCount: exam.questionCount || exam._count?.questions || 0,
      submissionCount: exam.submissionCount || exam._count?.submissions || 0,
    }));
  }, [examSets]);

  // Transform submissions
  const submissions: Submission[] = useMemo(() => {
    return rawSubmissions.map(sub => ({
      ...sub,
      percentage: sub.percentage || Math.round((sub.score / sub.totalPoints) * 100),
    }));
  }, [rawSubmissions]);

  // Filter submissions by classroom and search query
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Filter by classroom
    if (selectedClassroom) {
      filtered = filtered.filter((s) => s.classroom === selectedClassroom);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.studentName.toLowerCase().includes(query) ||
          s.studentId.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.studentName.localeCompare(b.studentName, "th");
          break;
        case "score":
          comparison = a.percentage - b.percentage;
          break;
        case "date":
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [submissions, selectedClassroom, searchQuery, sortBy, sortOrder]);

  // Get unique classrooms for filter
  const classrooms = useMemo(() => {
    const unique = [...new Set(submissions.map((s) => s.classroom).filter(Boolean))] as string[];
    return unique.sort();
  }, [submissions]);

  // Statistics calculations
  const stats = useMemo(() => {
    const data = filteredSubmissions;
    if (data.length === 0) {
      return { total: 0, passRate: 0, avgScore: 0, maxScore: 0, minScore: 0 };
    }

    const passCount = data.filter((s) => s.percentage >= 60).length;
    const percentages = data.map((s) => s.percentage);

    return {
      total: data.length,
      passRate: Math.round((passCount / data.length) * 100),
      avgScore: Math.round(percentages.reduce((a, b) => a + b, 0) / data.length),
      maxScore: Math.max(...percentages),
      minScore: Math.min(...percentages),
    };
  }, [filteredSubmissions]);

  // Score distribution for bar chart
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { range: "0-10%", min: 0, max: 10 },
      { range: "11-20%", min: 11, max: 20 },
      { range: "21-30%", min: 21, max: 30 },
      { range: "31-40%", min: 31, max: 40 },
      { range: "41-50%", min: 41, max: 50 },
      { range: "51-60%", min: 51, max: 60 },
      { range: "61-70%", min: 61, max: 70 },
      { range: "71-80%", min: 71, max: 80 },
      { range: "81-90%", min: 81, max: 90 },
      { range: "91-100%", min: 91, max: 100 },
    ];

    return ranges.map((r) => ({
      range: r.range,
      count: filteredSubmissions.filter(
        (s) => s.percentage >= r.min && s.percentage <= r.max
      ).length,
    }));
  }, [filteredSubmissions]);

  // Pass/Fail data for pie chart
  const passFailData = useMemo(() => {
    const pass = filteredSubmissions.filter((s) => s.percentage >= 60).length;
    const fail = filteredSubmissions.length - pass;
    return [
      { name: "ผ่าน", value: pass },
      { name: "ไม่ผ่าน", value: fail },
    ];
  }, [filteredSubmissions]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / ROWS_PER_PAGE);
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredSubmissions.slice(start, start + ROWS_PER_PAGE);
  }, [filteredSubmissions, currentPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedExamSetId, selectedClassroom, searchQuery]);

  // Handlers
  const handleRefresh = () => {
    mutateExams();
    mutateSubmissions();
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;

    try {
      const response = await fetch(`/api/results/${submissionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        mutateSubmissions();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleToggleExamStatus = async (examId: string) => {
    const exam = examSets.find((e) => e.id === examId);
    if (!exam) return;

    try {
      await fetch(`/api/exam-sets/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !exam.isActive }),
      });
      mutateExams();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert("ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    const headers = ["ลำดับ", "เลขที่", "ชื่อ-นามสกุล", "ห้อง", "รหัสนักเรียน", "ชุดข้อสอบ", "คะแนน", "เปอร์เซ็นต์", "วันที่"];
    const rows = filteredSubmissions.map((sub, index) => [
      index + 1,
      sub.studentNumber || "-",
      sub.studentName,
      sub.classroom || "-",
      sub.studentId,
      sub.examTitle,
      `${sub.score}/${sub.totalPoints}`,
      `${sub.percentage}%`,
      new Date(sub.submittedAt).toLocaleString("th-TH"),
    ]);

    const BOM = "\uFEFF";
    const csvContent = BOM + [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (isLoading && submissions.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Empty state
  if (!isLoading && examSets.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Icon name="chart" size="lg" className="text-indigo-600" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">ภาพรวมระบบสอบออนไลน์</p>
          </div>
        </div>
        <EmptyState
          icon="chart"
          title="ยังไม่มีข้อมูล"
          description="เริ่มต้นสร้างชุดข้อสอบเพื่อดูข้อมูลสถิติ"
          action={
            <a
              href="/admin/exams"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Icon name="plus" size="sm" />
              สร้างชุดข้อสอบ
            </a>
          }
        />
      </div>
    );
  }

  const selectedExam = selectedExamSetId ? examSets.find((e) => e.id === selectedExamSetId) : null;

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6 print:p-2">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Icon name="chart" size="lg" className="text-indigo-600" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">ภาพรวมระบบสอบออนไลน์</p>
          </div>

          <DashboardFilters
            examSets={examSetsForFilter}
            classrooms={classrooms}
            selectedExamSetId={selectedExamSetId}
            selectedClassroom={selectedClassroom}
            sortBy={sortBy}
            sortOrder={sortOrder}
            isLoading={isLoading}
            onExamSetChange={setSelectedExamSetId}
            onClassroomChange={setSelectedClassroom}
            onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon="users" label="จำนวนผู้สอบ" value={stats.total} color="indigo" />
          <StatCard icon="check-circle" label="อัตราผ่าน" value={`${stats.passRate}%`} color="green" />
          <StatCard icon="chart" label="คะแนนเฉลี่ย" value={`${stats.avgScore}%`} color="blue" />
          <StatCard icon="star" label="คะแนนสูงสุด" value={`${stats.maxScore}%`} color="yellow" />
          <StatCard icon="minus" label="คะแนนต่ำสุด" value={`${stats.minScore}%`} color="red" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          <ScoreDistributionChart data={scoreDistribution} />
          <PassFailPieChart data={passFailData} />
        </div>

        {/* Exam Management Quick Actions */}
        {selectedExam && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <Icon name="settings" size="md" className="text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">{selectedExam.title}</p>
                <p className="text-sm text-amber-600">
                  สถานะ: {selectedExam.isActive ? "🟢 เปิดรับสอบ" : "🔴 ปิดรับสอบ"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggleExamStatus(selectedExamSetId)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedExam.isActive
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {selectedExam.isActive ? "ปิดรับสอบ" : "เปิดรับสอบ"}
            </button>
          </div>
        )}

        {/* Submissions Table */}
        <SubmissionsTable
          submissions={paginatedSubmissions}
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={ROWS_PER_PAGE}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onPageChange={setCurrentPage}
          onDelete={handleDelete}
          onExportCSV={handleExportCSV}
          onPrint={handlePrint}
          isLoading={isLoadingSubmissions}
        />
      </div>
    </div>
  );
}
