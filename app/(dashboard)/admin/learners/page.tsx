"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import { useExamSets } from "@/lib/hooks/useExamSets";
import { useSubmissions } from "@/lib/hooks/useSubmissions";

type TabType = "overview" | "progress";
type StatusType = "pass" | "failed";

interface LearnerData {
  id: string;
  studentName: string;
  studentId: string;
  classroom: string | null;
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  status: StatusType;
}

const statusConfig: Record<StatusType, { label: string; color: string; bg: string }> = {
  pass: { label: "Pass", color: "text-green-600", bg: "bg-green-100" },
  failed: { label: "Failed", color: "text-red-600", bg: "bg-red-100" },
};

export default function LearnersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  
  const { examSets, isLoading: isLoadingExams } = useExamSets();
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions(selectedExamId || undefined);

  const isLoading = isLoadingExams || isLoadingSubmissions;

  // Transform submissions to learner data
  const learners: LearnerData[] = useMemo(() => {
    return submissions.map((sub) => ({
      id: sub.id,
      studentName: sub.studentName,
      studentId: sub.studentId,
      classroom: sub.classroom ?? null,
      score: sub.score,
      totalPoints: sub.totalPoints,
      percentage: sub.percentage || Math.round((sub.score / sub.totalPoints) * 100),
      submittedAt: sub.submittedAt,
      status: (sub.percentage || Math.round((sub.score / sub.totalPoints) * 100)) >= 60 ? "pass" : "failed" as StatusType,
    }));
  }, [submissions]);

  // Filter learners by search
  const [sortBy, setSortBy] = useState<"name" | "score" | "progress" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<StatusType | "all">("all");

  const filteredLearners = useMemo(() => {
    let result = learners;
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.studentName.toLowerCase().includes(query) ||
          l.studentId.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case "score":
          comparison = a.score - b.score;
          break;
        case "progress":
          comparison = a.percentage - b.percentage;
          break;
        case "date":
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [learners, searchQuery, statusFilter, sortBy, sortOrder]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Name", "Student ID", "Classroom", "Score", "Total", "Percentage", "Status", "Submitted At"];
    const rows = filteredLearners.map((l) => [
      l.studentName,
      l.studentId,
      l.classroom || "-",
      l.score.toString(),
      l.totalPoints.toString(),
      `${l.percentage}%`,
      statusConfig[l.status].label,
      new Date(l.submittedAt).toLocaleString(),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `learners_progress_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Calculate overview stats
  const stats = useMemo(() => {
    const total = learners.length;
    if (total === 0) {
      return {
        trainedPercent: 0,
        passed: 0,
        failed: 0,
        avgScore: 0,
        avgPercentage: 0,
        maxScore: 0,
        minScore: 0,
        maxPercentage: 0,
        minPercentage: 0,
        totalExams: 0,
      };
    }

    const passed = learners.filter((l) => l.percentage >= 60).length;
    const failed = total - passed;
    const scores = learners.map((l) => l.score);
    const percentages = learners.map((l) => l.percentage);
    const totalScore = scores.reduce((sum, s) => sum + s, 0);
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

    return {
      trainedPercent: Math.round((passed / total) * 100),
      passed,
      failed,
      avgScore: Math.round(totalScore / total * 10) / 10,
      avgPercentage: Math.round(totalPercentage / total),
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      maxPercentage: Math.max(...percentages),
      minPercentage: Math.min(...percentages),
      totalExams: total,
    };
  }, [learners]);

  // Get top 5 performers
  const topPerformers = useMemo(() => {
    return [...learners]
      .sort((a, b) => b.percentage - a.percentage || b.score - a.score)
      .slice(0, 5);
  }, [learners]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Random avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-orange-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Learners</h1>
        
        {/* Tabs */}
        <div className="mt-4 flex items-center gap-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === "overview"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
            {activeTab === "overview" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === "progress"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Progress
            {activeTab === "progress" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Exam Selector - Styled to match theme */}
          <div className="relative">
            <Icon name="document" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-border rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="">ทุกข้อสอบ</option>
              {examSets.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size="xs" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* People count - Styled as pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm text-gray-600">
            <Icon name="users" size="sm" className="text-indigo-500" />
            <span className="font-medium">{learners.length}</span>
            <span className="text-gray-400">คน</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search - Match theme */}
          <div className="relative">
            <Icon name="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-card w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Export Button - gray-900 to match theme */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
            <Icon name="download" size="sm" />
            Export
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Icon name="spinner" size="lg" className="text-indigo-600" />
        </div>
      )}

      {/* Overview Tab Content */}
      {!isLoading && activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="flex flex-wrap items-center gap-6">
            {/* Pass Rate Circle */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#10b981"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(stats.trainedPercent / 100) * 176} 176`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                  {stats.trainedPercent}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Pass Rate</p>
                <p className="text-xs text-gray-500">{stats.passed} passed, {stats.failed} failed</p>
              </div>
            </div>

            <div className="h-10 w-px bg-gray-200" />

            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xl font-bold text-green-600">{stats.passed}</span>
                <p className="text-xs text-gray-500">Passed</p>
              </div>
              <div>
                <span className="text-xl font-bold text-red-600">{stats.failed}</span>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
              <div>
                <span className="text-xl font-bold text-indigo-600">{stats.avgPercentage}%</span>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Average Score */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Icon name="chart" size="md" className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgPercentage}%</p>
                  <p className="text-sm text-gray-500">Average Score</p>
                </div>
              </div>
            </div>

            {/* Max Score */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Icon name="star" size="md" className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.maxPercentage}%</p>
                  <p className="text-sm text-gray-500">Highest Score</p>
                </div>
              </div>
            </div>

            {/* Min Score */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Icon name="chevron-down" size="md" className="text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.minPercentage}%</p>
                  <p className="text-sm text-gray-500">Lowest Score</p>
                </div>
              </div>
            </div>

            {/* Total Exams */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Icon name="document" size="md" className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
                  <p className="text-sm text-gray-500">Total Exams</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard - Top 5 */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Icon name="star" size="sm" className="text-amber-500" />
              <h3 className="font-semibold text-gray-800">Top 5 Performers</h3>
            </div>
            {topPerformers.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Icon name="users" size="lg" className="mx-auto mb-2" />
                <p>No data available</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Classroom</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topPerformers.map((learner, index) => (
                    <tr key={learner.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                          index === 0 ? "bg-amber-100 text-amber-700" :
                          index === 1 ? "bg-gray-100 text-gray-600" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-50 text-gray-500"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${getAvatarColor(learner.studentName)} flex items-center justify-center text-white text-sm font-medium`}>
                            {getInitials(learner.studentName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{learner.studentName}</p>
                            <p className="text-xs text-gray-500">{learner.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {learner.classroom || "-"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-semibold text-gray-900">{learner.score}</span>
                        <span className="text-gray-400">/{learner.totalPoints}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          learner.percentage >= 80 ? "bg-green-100 text-green-700" :
                          learner.percentage >= 60 ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {learner.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Progress Tab Content */}
      {!isLoading && activeTab === "progress" && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Controls Bar */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Filter by Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusType | "all")}
                  className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pass">Pass</option>
                  <option value="failed">Failed</option>
                </select>
                <Icon name="filter" size="xs" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Icon name="chevron-down" size="xs" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Sort By */}
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="name-asc">Name A → Z</option>
                  <option value="name-desc">Name Z → A</option>
                  <option value="score-desc">Score High → Low</option>
                  <option value="score-asc">Score Low → High</option>
                  <option value="progress-desc">Progress High → Low</option>
                  <option value="progress-asc">Progress Low → High</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </select>
                <Icon name="settings" size="xs" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Icon name="chevron-down" size="xs" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* CSV Export */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Icon name="download" size="sm" />
                CSV
              </button>
              
              {/* Print */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Icon name="file-text" size="sm" />
                Print
              </button>
            </div>
          </div>
          
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Full name ↕
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status ↕
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Score ↕
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Progress ↕
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Classroom
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Icon name="users" size="xl" className="mx-auto mb-2 text-gray-300" />
                    <p>ยังไม่มีข้อมูลผู้เรียน</p>
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(learner.studentName)} flex items-center justify-center text-white text-sm font-medium`}>
                          {getInitials(learner.studentName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{learner.studentName}</p>
                          <p className="text-xs text-gray-500">{learner.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[learner.status].bg} ${statusConfig[learner.status].color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${learner.status === "pass" ? "bg-green-500" : "bg-red-500"}`} />
                        {statusConfig[learner.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        {learner.score}pts
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {/* Circular Progress */}
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90">
                            <circle
                              cx="16"
                              cy="16"
                              r="12"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                              fill="none"
                            />
                            <circle
                              cx="16"
                              cy="16"
                              r="12"
                              stroke={learner.percentage >= 60 ? "#10b981" : "#f59e0b"}
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${(learner.percentage / 100) * 75.4} 75.4`}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{learner.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {learner.classroom || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
