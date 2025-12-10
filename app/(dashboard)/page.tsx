"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ExamCard from "@/components/ExamCard";
import Icon from "@/components/Icon";

interface ExamSet {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  isActive: boolean;
  questionCount: number;
  submissionCount: number;
  timeLimitMinutes: number | null;
  createdAt: string;
}

const subjectColors: Record<string, string> = {
  "คณิตศาสตร์": "math",
  "วิทยาศาสตร์": "science",
  "ภาษาอังกฤษ": "english",
  "ศิลปะ": "art",
  "ภาษาไทย": "thai",
};

export default function DashboardPage() {
  const router = useRouter();
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "closed">("all");

  // Fetch exam sets
  useEffect(() => {
    const fetchExamSets = async () => {
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
    };

    fetchExamSets();
  }, []);

  // Handle select exam - ลิงก์ไปที่ /exam/[id] โดยตรง
  const handleSelectExam = (examId: string) => {
    router.push(`/exam/${examId}`);
  };

  // Filter exam sets
  const filteredExamSets = examSets.filter((exam) => {
    if (selectedFilter === "active") return exam.isActive;
    if (selectedFilter === "closed") return !exam.isActive;
    return true;
  });

  const activeCount = examSets.filter((e) => e.isActive).length;

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      {/* Welcome Message */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            ยินดีต้อนรับ, นักเรียน
          </h1>
          <p className="text-gray-500">
            วันนี้คุณมีการสอบที่เปิดอยู่ {activeCount} รายการ
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                selectedFilter === "all"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-muted"
              }`}
            >
              <Icon name="list" size="xs" />
              ทั้งหมด
              <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                selectedFilter === "all" ? "bg-white/20" : "bg-muted"
              }`}>{examSets.length}</span>
            </button>
            <button
              onClick={() => setSelectedFilter("active")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                selectedFilter === "active"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-muted"
              }`}
            >
              <Icon name="check-circle" size="xs" />
              เปิดสอบ
              <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                selectedFilter === "active" ? "bg-white/20" : "bg-green-100 text-green-700"
              }`}>{activeCount}</span>
            </button>
            <button
              onClick={() => setSelectedFilter("closed")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                selectedFilter === "closed"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-muted"
              }`}
            >
              <Icon name="lock" size="xs" />
              ปิดสอบ
              <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                selectedFilter === "closed" ? "bg-white/20" : "bg-muted"
              }`}>{examSets.length - activeCount}</span>
            </button>
          </div>
        </div>

        {/* Exam Cards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="spinner" size="lg" className="text-gray-600" />
            <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
          </div>
        ) : filteredExamSets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
            <Icon name="folder" size="xl" className="text-gray-400 mb-4" />
            <p className="text-gray-500">ยังไม่มีข้อสอบในระบบ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filteredExamSets.map((exam) => (
              <ExamCard
                key={exam.id}
                id={exam.id}
                title={exam.title}
                teacher="ผู้สอน"
                subject={exam.subject || "ทั่วไป"}
                subjectColor={subjectColors[exam.subject || ""] || "default"}
                time={exam.timeLimitMinutes || 0}
                questionCount={exam.questionCount}
                isActive={exam.isActive}
                onStart={handleSelectExam}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
