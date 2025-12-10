"use client";

import { useState, useRef, useEffect } from "react";
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

// Filter icon SVG
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// Sort icon SVG
const SortIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="14" y2="6" />
    <line x1="4" y1="12" x2="11" y2="12" />
    <line x1="4" y1="18" x2="8" y2="18" />
    <polyline points="17 9 20 6 23 9" />
    <polyline points="17 15 20 18 23 15" />
    <line x1="20" y1="6" x2="20" y2="18" />
  </svg>
);

// Check icon SVG
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const examRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examRef.current && !examRef.current.contains(event.target as Node)) {
        setShowExamDropdown(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortOptions = [
    { value: "date-desc", label: "วันที่ล่าสุด" },
    { value: "date-asc", label: "วันที่เก่าสุด" },
    { value: "score-desc", label: "คะแนนสูง → ต่ำ" },
    { value: "score-asc", label: "คะแนนต่ำ → สูง" },
    { value: "name-asc", label: "ชื่อ ก → ฮ" },
    { value: "name-desc", label: "ชื่อ ฮ → ก" },
  ];

  const selectedExam = examSets.find(e => e.id === selectedExamSetId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Exam Selector Dropdown */}
      <div className="relative" ref={examRef}>
        <button
          onClick={() => {
            setShowExamDropdown(!showExamDropdown);
            setShowFilterDropdown(false);
            setShowSortDropdown(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
            selectedExamSetId 
              ? "border-gray-400 bg-gray-100 text-gray-800" 
              : "border-border bg-card text-gray-600 hover:bg-muted"
          }`}
        >
          <Icon name="document" size="sm" />
          {selectedExam ? selectedExam.title : "ทุกชุดข้อสอบ"}
          <Icon name="chevron-down" size="xs" className="ml-1" />
        </button>
        
        {showExamDropdown && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-gray-500 uppercase">เลือกชุดข้อสอบ</p>
            </div>
            <div className="py-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  onExamSetChange("");
                  setShowExamDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <span className="w-4">{selectedExamSetId === "" && <CheckIcon />}</span>
                ทุกชุดข้อสอบ
              </button>
              {examSets.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => {
                    onExamSetChange(exam.id);
                    setShowExamDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <span className="w-4">{selectedExamSetId === exam.id && <CheckIcon />}</span>
                  <span className="flex-1 truncate">{exam.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${exam.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {exam.isActive ? "เปิด" : "ปิด"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Button with Dropdown */}
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => {
            setShowFilterDropdown(!showFilterDropdown);
            setShowExamDropdown(false);
            setShowSortDropdown(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
            selectedClassroom 
              ? "border-gray-400 bg-gray-100 text-gray-800" 
              : "border-border bg-card text-gray-600 hover:bg-muted"
          }`}
        >
          <FilterIcon />
          Filter
          {selectedClassroom && <span className="ml-1 w-1.5 h-1.5 bg-gray-600 rounded-full" />}
        </button>
        
        {showFilterDropdown && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-gray-500 uppercase">Filter by ห้อง</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  onClassroomChange("");
                  setShowFilterDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <span className="w-4">{selectedClassroom === "" && <CheckIcon />}</span>
                ทุกห้อง
              </button>
              {classrooms.map((room) => (
                <button
                  key={room}
                  onClick={() => {
                    onClassroomChange(room);
                    setShowFilterDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <span className="w-4">{selectedClassroom === room && <CheckIcon />}</span>
                  ห้อง {room}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sort Button with Dropdown */}
      <div className="relative" ref={sortRef}>
        <button
          onClick={() => {
            setShowSortDropdown(!showSortDropdown);
            setShowExamDropdown(false);
            setShowFilterDropdown(false);
          }}
          className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-gray-600 bg-card hover:bg-muted transition-colors"
        >
          <SortIcon />
          Sort by
        </button>
        
        {showSortDropdown && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-gray-500 uppercase">Sort by</p>
            </div>
            <div className="py-1">
              {sortOptions.map((option) => {
                const isSelected = `${sortBy}-${sortOrder}` === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      const [by, order] = option.value.split("-") as ["name" | "score" | "date", "asc" | "desc"];
                      onSortChange(by, order);
                      setShowSortDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <span className="w-4">{isSelected && <CheckIcon />}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-2 border border-border rounded-lg bg-card hover:bg-muted transition-colors disabled:opacity-50"
        title="รีเฟรช"
      >
        <Icon name={isLoading ? "spinner" : "refresh"} size="sm" className="text-gray-500" />
      </button>

      {/* Manage Exams Link */}
      <Link
        href="/admin/exams"
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        <Icon name="settings" size="sm" />
        <span className="hidden sm:inline">จัดการ</span>
      </Link>
    </div>
  );
}
