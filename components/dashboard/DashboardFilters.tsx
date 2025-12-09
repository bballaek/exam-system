"use client";

import Link from "next/link";
import Icon from "@/components/Icon";

export interface ExamSet {
  id: string;
  title: string;
  isActive: boolean;
  questionCount: number;
  submissionCount: number;
}

interface DashboardFiltersProps {
  examSets: ExamSet[];
  classrooms: string[];
  selectedExamSetId: string;
  selectedClassroom: string;
  sortBy: "name" | "score" | "date";
  sortOrder: "asc" | "desc";
  isLoading: boolean;
  onExamSetChange: (id: string) => void;
  onClassroomChange: (classroom: string) => void;
  onSortChange: (by: "name" | "score" | "date", order: "asc" | "desc") => void;
  onRefresh: () => void;
}

export default function DashboardFilters({
  examSets,
  classrooms,
  selectedExamSetId,
  selectedClassroom,
  sortBy,
  sortOrder,
  isLoading,
  onExamSetChange,
  onClassroomChange,
  onSortChange,
  onRefresh,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Exam Selector */}
      <div className="relative">
        <Icon name="document" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <select
          value={selectedExamSetId}
          onChange={(e) => onExamSetChange(e.target.value)}
          className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[180px] appearance-none cursor-pointer shadow-sm transition-all"
        >
          <option value="">ทุกชุดข้อสอบ</option>
          {examSets.map((exam) => (
            <option key={exam.id} value={exam.id}>
              [{exam.isActive ? "เปิด" : "ปิด"}] {exam.title}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size="sm" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Classroom Filter */}
      <div className="relative">
        <Icon name="users" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <select
          value={selectedClassroom}
          onChange={(e) => onClassroomChange(e.target.value)}
          className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 min-w-[120px] appearance-none cursor-pointer shadow-sm transition-all"
        >
          <option value="">ทุกห้อง</option>
          {classrooms.map((room) => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size="sm" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Sort By */}
      <div className="relative">
        <Icon name="sort" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split("-") as ["name" | "score" | "date", "asc" | "desc"];
            onSortChange(by, order);
          }}
          className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 min-w-[160px] appearance-none cursor-pointer shadow-sm transition-all"
        >
          <option value="date-desc">วันที่ล่าสุด</option>
          <option value="date-asc">วันที่เก่าสุด</option>
          <option value="score-desc">คะแนนสูง→ต่ำ</option>
          <option value="score-asc">คะแนนต่ำ→สูง</option>
          <option value="name-asc">ชื่อ ก→ฮ</option>
          <option value="name-desc">ชื่อ ฮ→ก</option>
        </select>
        <Icon name="chevron-down" size="sm" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Actions */}
      <Link
        href="/admin/exams"
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <Icon name="settings" size="sm" />
        <span className="hidden sm:inline">จัดการข้อสอบ</span>
      </Link>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
      >
        <Icon name={isLoading ? "spinner" : "refresh"} size="sm" />
        รีเฟรช
      </button>
    </div>
  );
}
