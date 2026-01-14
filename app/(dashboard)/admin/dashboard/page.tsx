
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useExamSets } from "@/lib/hooks/useExamSets";
import { useSubmissions } from "@/lib/hooks/useSubmissions";
import { useToast } from "@/components/Toast";
import {
  StatCard,
  ScoreDistributionChart,
  PassFailPieChart,
  SubmissionsTable,
  DashboardFilters,
  DashboardSkeleton,
  EmptyState,
  StudentGrouping,
  ResearchStatistics,
  BoxPlotChart,
  ClassroomComparisonChart,
} from "@/components/dashboard";
import { calculateAllStatistics, groupStudentsByPercentile } from "@/lib/statistics";
import type { Submission } from "@/components/dashboard/SubmissionsTable";
import type { ExamSet } from "@/components/dashboard/DashboardFilters";

const ROWS_PER_PAGE = 20;

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize filters from URL query params
  const [selectedExamSetId, setSelectedExamSetId] = useState<string>(searchParams.get("exam") || "");
  const [selectedClassroom, setSelectedClassroom] = useState<string>(searchParams.get("classroom") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState<"name" | "score" | "date">((searchParams.get("sortBy") as "name" | "score" | "date") || "date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sortOrder") as "asc" | "desc") || "desc");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));

  // Sync filter state to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedExamSetId) params.set("exam", selectedExamSetId);
    if (selectedClassroom) params.set("classroom", selectedClassroom);
    if (searchQuery) params.set("q", searchQuery);
    if (sortBy !== "date") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (currentPage > 1) params.set("page", currentPage.toString());
    
    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : "/admin/dashboard";
    
    // Replace URL without causing navigation (silent update)
    window.history.replaceState(null, "", newUrl);
  }, [selectedExamSetId, selectedClassroom, searchQuery, sortBy, sortOrder, currentPage]);


  const toast = useToast();

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

  // Selected exam memoized
  const selectedExam = useMemo(() => {
    return selectedExamSetId ? examSets.find((e) => e.id === selectedExamSetId) : null;
  }, [selectedExamSetId, examSets]);

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

  // Research statistics
  const researchStats = useMemo(() => {
    const percentages = filteredSubmissions.map((s) => s.percentage);
    return calculateAllStatistics(percentages);
  }, [filteredSubmissions]);

  // Student grouping by percentile
  const studentGroups = useMemo(() => {
    return groupStudentsByPercentile(
      filteredSubmissions.map((s) => ({
        id: s.id,
        studentName: s.studentName,
        percentage: s.percentage,
        score: s.score,
      }))
    );
  }, [filteredSubmissions]);

  // Box Plot data
  const boxPlotData = useMemo(() => ({
    min: researchStats.min,
    q1: researchStats.q1,
    median: researchStats.median,
    q3: researchStats.q3,
    max: researchStats.max,
    mean: researchStats.mean,
  }), [researchStats]);

  // Classroom comparison data
  const classroomStats = useMemo(() => {
    const classroomMap = new Map<string, { scores: number[]; count: number }>();
    
    submissions.forEach((s) => {
      const room = s.classroom || "ไม่ระบุ";
      if (!classroomMap.has(room)) {
        classroomMap.set(room, { scores: [], count: 0 });
      }
      const data = classroomMap.get(room)!;
      data.scores.push(s.percentage);
      data.count++;
    });

    return Array.from(classroomMap.entries()).map(([classroom, data]) => ({
      classroom,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count,
      passRate: (data.scores.filter((s) => s >= 60).length / data.scores.length) * 100,
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [submissions]);

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

  // Handlers with useCallback
  const handleRefresh = useCallback(() => {
    mutateExams();
    mutateSubmissions();
  }, [mutateExams, mutateSubmissions]);

  const handleDelete = useCallback(async (submissionId: string) => {
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
  }, [mutateSubmissions]);

  const handleToggleExamStatus = useCallback(async (examId: string) => {
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
  }, [examSets, mutateExams]);

  const handleExportCSV = useCallback(() => {
    if (filteredSubmissions.length === 0) {
      toast.showToast("info", "ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    // Dynamic import to avoid SSR issues
    import("@/lib/exportData").then(({ exportSubmissionsToCSV }) => {
      exportSubmissionsToCSV(filteredSubmissions, "exam_results");
      toast.showToast("success", "ส่งออกข้อมูลเรียบร้อย");
    });
  }, [filteredSubmissions, toast]);

  const handleExportStatistics = useCallback(() => {
    if (filteredSubmissions.length === 0) {
      toast.showToast("info", "ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    const examTitle = selectedExam?.title || "ทุกชุดข้อสอบ";
    import("@/lib/exportData").then(({ exportStatisticsToCSV }) => {
      exportStatisticsToCSV(researchStats, examTitle, "statistics");
      toast.showToast("success", "ส่งออกสถิติเรียบร้อย");
    });
  }, [filteredSubmissions, selectedExam, researchStats, toast]);

  const handleExportResearch = useCallback(() => {
    if (filteredSubmissions.length === 0) {
      toast.showToast("info", "ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    const examTitle = selectedExam?.title || "ทุกชุดข้อสอบ";
    import("@/lib/exportData").then(({ exportResearchReport }) => {
      exportResearchReport(filteredSubmissions, researchStats, examTitle, "research_report");
      toast.showToast("success", "ส่งออกรายงานวิจัยเรียบร้อย");
    });
  }, [filteredSubmissions, selectedExam, researchStats, toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Bulk operations
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (!confirm(`คุณต้องการลบ ${ids.length} รายการที่เลือกใช่หรือไม่?`)) return;

    try {
      const response = await fetch('/api/results/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.showToast('success', `ลบ ${data.deleted} รายการเรียบร้อย`);
        mutateSubmissions();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.showToast('error', 'เกิดข้อผิดพลาดในการลบ');
    }
  }, [mutateSubmissions, toast]);

  const handleBulkExport = useCallback((selected: Submission[]) => {
    if (selected.length === 0) {
      toast.showToast('info', 'ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    import('@/lib/exportData').then(({ exportSubmissionsToCSV }) => {
      exportSubmissionsToCSV(selected, 'selected_results');
      toast.showToast('success', `ส่งออก ${selected.length} รายการเรียบร้อย`);
    });
  }, [toast]);

  // Loading state
  if (isLoading && submissions.length === 0) {
    return (
      <div className="min-h-screen bg-surface p-4 md:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Empty state
  if (!isLoading && examSets.length === 0) {
    return (
      <div className="min-h-screen bg-surface p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Icon name="chart" size="lg" className="text-indigo-600" />
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Overview of the online exam system</p>
          </div>
        </div>
        <EmptyState
          icon="chart"
          title="No data available"
          description="Start creating exam sets to view statistics"
          action={
            <a
              href="/admin/exams"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Icon name="plus" size="sm" />
              Create exam set
            </a>
          }
        />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-surface p-4 md:p-6">
      <div className="space-y-6 print:p-2">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Icon name="chart" size="lg" className="text-indigo-600" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Overview of the online exam system</p>
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

        {/* Lead Metrics Cards - Top Section */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon="users" 
              label="Total Students" 
              value={stats.total} 
              color="indigo" 
            />
            <StatCard 
              icon="check-circle" 
              label="Pass Rate" 
              value={`${stats.passRate}%`} 
              color="green" 
            />
            <StatCard 
              icon="star" 
              label="Max Score" 
              value={`${stats.maxScore}%`} 
              color="yellow" 
            />
            <StatCard 
              icon="chart" 
              label="Average Score" 
              value={`${stats.avgScore}%`} 
              color="blue" 
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          <ScoreDistributionChart data={scoreDistribution} />
          <PassFailPieChart data={passFailData} />
        </div>

        {/* Research Analytics Section - Collapsible */}
        <details className="group print:hidden">
          <summary className="flex items-center justify-between cursor-pointer rounded-xl border border-border bg-card p-4 hover:bg-muted transition-colors list-none">
            <div className="flex items-center gap-3">
              <Icon name="chart" size="md" className="text-indigo-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Research Analytics</h3>
                <p className="text-xs text-gray-500">Statistics, Student Grouping, Box Plot, Compare Classrooms</p>
              </div>
            </div>
            <Icon name="chevron-down" size="sm" className="text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          
          <div className="mt-4 space-y-6">
            {/* Research Statistics & Student Grouping */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResearchStatistics 
                statistics={researchStats} 
                isLoading={isLoading}
                onExportCSV={handleExportCSV}
                onExportStatistics={handleExportStatistics}
                onExportResearch={handleExportResearch}
              />
              <StudentGrouping groups={studentGroups} isLoading={isLoading} />
            </div>

            {/* Box Plot & Classroom Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BoxPlotChart data={boxPlotData} />
              <ClassroomComparisonChart data={classroomStats} overallAvg={stats.avgScore} />
            </div>
          </div>
        </details>

        {/* Exam Management Quick Actions */}
        {selectedExam && (
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <Icon name="settings" size="md" className="text-indigo-600" />
              <div>
                <p className="font-medium text-gray-800">{selectedExam.title}</p>
                <p className="text-sm text-gray-600">
                  Status: {selectedExam.isActive ? "Open for Exam" : "Closed for Exam"}
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
              {selectedExam.isActive ? "Close Exam" : "Open Exam"}
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
          classrooms={classrooms}
          selectedClassroom={selectedClassroom}
          onClassroomChange={setSelectedClassroom}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
        />
      </div>
    </div>
  );
}
