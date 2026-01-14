"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";

interface ExamStatus {
  exam_set_id: string;
  title: string;
  active_count: number;
  warning_count: number;
}

export default function StatusPage() {
  const [examStatuses, setExamStatuses] = useState<ExamStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveExams() {
      const supabase = createClient();
      
      try {
        // Get all active sessions grouped by exam
        const { data: sessions, error } = await supabase
          .from("exam_sessions")
          .select("exam_set_id, warnings")
          .eq("status", "active");

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
          setExamStatuses([]);
          setIsLoading(false);
          return;
        }

        // Group by exam_set_id
        const examMap = new Map<string, { count: number; warnings: number }>();
        sessions.forEach((s) => {
          const existing = examMap.get(s.exam_set_id) || { count: 0, warnings: 0 };
          examMap.set(s.exam_set_id, {
            count: existing.count + 1,
            warnings: existing.warnings + (s.warnings > 0 ? 1 : 0),
          });
        });

        // Fetch exam titles
        const examIds = Array.from(examMap.keys());
        const examPromises = examIds.map(async (id) => {
          try {
            const res = await fetch(`/api/exam-sets/${id}`);
            if (res.ok) {
              const data = await res.json();
              return { id, title: data.title || "Unknown" };
            }
          } catch {
            return { id, title: "Unknown" };
          }
          return { id, title: "Unknown" };
        });

        const examTitles = await Promise.all(examPromises);
        const titleMap = new Map(examTitles.map((e) => [e.id, e.title]));

        // Build status array
        const statuses: ExamStatus[] = Array.from(examMap.entries()).map(([id, data]) => ({
          exam_set_id: id,
          title: titleMap.get(id) || "Unknown",
          active_count: data.count,
          warning_count: data.warnings,
        }));

        setExamStatuses(statuses);
      } catch (error: any) {
        console.error("Error fetching active exams:", error.message || error);
        console.error("Full error object:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActiveExams();

    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveExams, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalActive = examStatuses.reduce((sum, e) => sum + e.active_count, 0);
  const totalWarnings = examStatuses.reduce((sum, e) => sum + e.warning_count, 0);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Real-time Status</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor active exam sessions in real-time</p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Active Sessions Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm text-gray-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">{totalActive}</span>
            <span className="text-gray-400">Active Sessions</span>
          </div>
          
          {/* Warning Badge */}
          {totalWarnings > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-yellow-200 bg-yellow-50 text-sm text-yellow-700">
              <Icon name="warning" size="sm" />
              <span className="font-medium">{totalWarnings}</span>
              <span>Warnings</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-refresh indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Icon name="refresh" size="sm" className="animate-spin" />
            <span>Auto-refresh 10s</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Icon name="spinner" size="lg" className="text-indigo-600" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Icon name="users" size="md" className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
                  <p className="text-sm text-gray-500">Active Students</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Icon name="document" size="md" className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{examStatuses.length}</p>
                  <p className="text-sm text-gray-500">Active Exams</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Icon name="warning" size="md" className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalWarnings}</p>
                  <p className="text-sm text-gray-500">Warnings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Exam List */}
          {examStatuses.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <Icon name="users" size="xl" className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No active exam sessions</p>
              <p className="text-gray-400 text-sm mt-1">This page auto-refreshes every 10 seconds</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Icon name="document" size="sm" className="text-gray-500" />
                  Active Exams ({examStatuses.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {examStatuses.map((exam) => (
                  <Link
                    key={exam.exam_set_id}
                    href={`/admin/exams/${exam.exam_set_id}/monitor`}
                    className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h2 className="font-medium text-gray-900">{exam.title}</h2>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="font-bold">{exam.active_count}</span> taking
                        </span>
                        {exam.warning_count > 0 && (
                          <span className="flex items-center gap-2 text-sm text-yellow-600">
                            <Icon name="warning" size="sm" />
                            <span className="font-bold">{exam.warning_count}</span> warnings
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon name="chevron-right" size="md" className="text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
