"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import ExamCard from "@/components/ExamCard";
import Icon from "@/components/Icon";
import type { ExamSetWithStats } from "@/lib/data/exam-sets";

const subjectColors: Record<string, string> = {
  "คณิตศาสตร์": "math",
  "วิทยาศาสตร์": "science",
  "ภาษาอังกฤษ": "english",
  "ศิลปะ": "art",
  "ภาษาไทย": "thai",
};

interface ExamCardGridProps {
  examSets: ExamSetWithStats[];
}

export default function ExamCardGrid({ examSets }: ExamCardGridProps) {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "closed">("all");

  const handleSelectExam = useCallback((examId: string) => {
    router.push(`/exam/${examId}`);
  }, [router]);

  // Memoize filtered exam sets
  const filteredExamSets = useMemo(() => {
    return examSets.filter((exam) => {
      if (selectedFilter === "active") return exam.isActive;
      if (selectedFilter === "closed") return !exam.isActive;
      return true;
    });
  }, [examSets, selectedFilter]);

  const activeCount = useMemo(() => 
    examSets.filter((e) => e.isActive).length,
    [examSets]
  );

  return (
    <div>
      {/* Nav Tabs */}
      <div className="mb-6 flex items-center gap-6 border-b border-gray-200">
        <button
          onClick={() => setSelectedFilter("all")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            selectedFilter === "all"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{examSets.length}</span>
          {selectedFilter === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setSelectedFilter("active")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            selectedFilter === "active"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">{activeCount}</span>
          {selectedFilter === "active" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setSelectedFilter("closed")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            selectedFilter === "closed"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Closed
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{examSets.length - activeCount}</span>
          {selectedFilter === "closed" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
          )}
        </button>
      </div>

      {/* Exam Cards Grid */}
      {filteredExamSets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
          <Icon name="folder" size="xl" className="text-gray-400 mb-4" />
          <p className="text-gray-500">No exams found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredExamSets.map((exam) => (
            <ExamCard
              key={exam.id}
              id={exam.id}
              title={exam.title}
              subject={exam.subject || "ทั่วไป"}
              classroom={exam.classroom}
              subjectColor={subjectColors[exam.subject || ""] || "default"}
              time={exam.timeLimitMinutes || 0}
              questionCount={exam.questionCount}
              totalPoints={exam.totalPoints}
              questionTypeCounts={exam.questionTypeCounts}
              isActive={exam.isActive}
              onStart={handleSelectExam}
            />
          ))}
        </div>
      )}
    </div>
  );
}
