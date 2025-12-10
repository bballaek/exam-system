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
              return { id, title: data.title || "ไม่ทราบชื่อ" };
            }
          } catch {
            return { id, title: "ไม่ทราบชื่อ" };
          }
          return { id, title: "ไม่ทราบชื่อ" };
        });

        const examTitles = await Promise.all(examPromises);
        const titleMap = new Map(examTitles.map((e) => [e.id, e.title]));

        // Build status array
        const statuses: ExamStatus[] = Array.from(examMap.entries()).map(([id, data]) => ({
          exam_set_id: id,
          title: titleMap.get(id) || "ไม่ทราบชื่อ",
          active_count: data.count,
          warning_count: data.warnings,
        }));

        setExamStatuses(statuses);
      } catch (error) {
        console.error("Error fetching active exams:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActiveExams();

    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveExams, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner" size="lg" className="text-gray-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Icon name="eye" size="md" className="text-indigo-600" />
          </span>
          สถานะการสอบ Real-time
        </h1>
        <p className="text-gray-500 mt-2">เลือกข้อสอบเพื่อดูรายละเอียดนักเรียนที่กำลังสอบ</p>
      </div>

      {/* Exam List */}
      {examStatuses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Icon name="users" size="xl" className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">ไม่มีนักเรียนกำลังสอบในขณะนี้</p>
          <p className="text-gray-400 text-sm mt-1">หน้านี้จะอัพเดทอัตโนมัติทุก 10 วินาที</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {examStatuses.map((exam) => (
            <Link
              key={exam.exam_set_id}
              href={`/admin/exams/${exam.exam_set_id}/monitor`}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{exam.title}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="font-bold">{exam.active_count}</span> คนกำลังสอบ
                    </span>
                    {exam.warning_count > 0 && (
                      <span className="flex items-center gap-2 text-sm text-yellow-600">
                        <Icon name="warning" size="sm" />
                        <span className="font-bold">{exam.warning_count}</span> มีเตือน
                      </span>
                    )}
                  </div>
                </div>
                <Icon name="chevron-right" size="md" className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-400">
        <Icon name="refresh" size="sm" className="inline-block mr-1" />
        อัพเดทอัตโนมัติทุก 10 วินาที
      </div>
    </div>
  );
}
