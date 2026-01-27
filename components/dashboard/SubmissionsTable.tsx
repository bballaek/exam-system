"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

export interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  studentNumber?: string;
  classroom?: string;
  score: number;
  totalPoints: number;
  percentage: number;
  examTitle: string;
  examSetId: string;
  submittedAt: string;
}

interface SubmissionsTableProps {
  submissions: Submission[];
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onExportCSV: () => void;
  onPrint: () => void;
  isLoading?: boolean;
  // Filter/sort props
  classrooms?: string[];
  selectedClassroom?: string;
  onClassroomChange?: (classroom: string) => void;
  sortBy?: "name" | "score" | "date" | "number";
  sortOrder?: "asc" | "desc";
  onSortChange?: (by: "name" | "score" | "date" | "number", order: "asc" | "desc") => void;
  // Bulk operation props
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (submissions: Submission[]) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

export default function SubmissionsTable({
  submissions,
  currentPage,
  totalPages,
  rowsPerPage,
  searchQuery,
  onSearchChange,
  onPageChange,
  onDelete,
  onExportCSV,
  onPrint,
  isLoading,
  classrooms = [],
  selectedClassroom = "",
  onClassroomChange,
  sortBy = "date",
  sortOrder = "desc",
  onSortChange,
  onBulkDelete,
  onBulkExport,
}: SubmissionsTableProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Get all current page submission IDs for select all
  const currentPageIds = useMemo(() => submissions.map(s => s.id), [submissions]);
  
  // Check if all items on current page are selected
  const allSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id));
  const someSelected = currentPageIds.some(id => selectedIds.has(id));

  // Clear selection when page/filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, searchQuery, selectedClassroom]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle single selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Toggle select all on current page
  const toggleSelectAll = () => {
    if (allSelected) {
      // Deselect all on current page
      const newSet = new Set(selectedIds);
      currentPageIds.forEach(id => newSet.delete(id));
      setSelectedIds(newSet);
    } else {
      // Select all on current page
      const newSet = new Set(selectedIds);
      currentPageIds.forEach(id => newSet.add(id));
      setSelectedIds(newSet);
    }
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // Handle bulk export
  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    if (onBulkExport) {
      const selected = submissions.filter(s => selectedIds.has(s.id));
      onBulkExport(selected);
    }
  };

  const sortOptions = [
    { value: "number-asc", label: "เลขที่ 1 → 99" },
    { value: "number-desc", label: "เลขที่ 99 → 1" },
    { value: "date-desc", label: "วันที่ล่าสุด" },
    { value: "date-asc", label: "วันที่เก่าสุด" },
    { value: "score-desc", label: "คะแนนสูง → ต่ำ" },
    { value: "score-asc", label: "คะแนนต่ำ → สูง" },
    { value: "name-asc", label: "ชื่อ ก → ฮ" },
    { value: "name-desc", label: "ชื่อ ฮ → ก" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden relative">
      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-20 bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-sm font-bold">
                {selectedIds.size}
              </span>
              <span className="text-sm">รายการที่เลือก</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <Icon name="download" size="sm" />
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors"
            >
              <Icon name="trash" size="sm" />
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Icon name="close" size="sm" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="document" size="sm" className="text-gray-500" />
          Exams ({submissions.length} items)
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Icon
              name="search"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search name or ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 w-44"
            />
          </div>

          {/* Filter Button with Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
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
            
            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Filter by ห้อง</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      onClassroomChange?.("");
                      setShowFilterDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <span className="w-4">{selectedClassroom === "" && <CheckIcon />}</span>
                    All
                  </button>
                  {classrooms.map((room) => (
                    <button
                      key={room}
                      onClick={() => {
                        onClassroomChange?.(room);
                        setShowFilterDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <span className="w-4">{selectedClassroom === room && <CheckIcon />}</span>
                      Room {room}
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
                setShowFilterDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-gray-600 bg-card hover:bg-muted transition-colors"
            >
              <SortIcon />
              Sort by
            </button>
            
            {/* Sort Dropdown */}
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
                          onSortChange?.(by, order);
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

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => {
                setShowExportDropdown(!showExportDropdown);
                setShowFilterDropdown(false);
                setShowSortDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-gray-600 bg-card hover:bg-muted transition-colors"
            >
              <Icon name="download" size="xs" />
              Export
              <Icon name="chevron-down" size="xs" className="ml-1" />
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Export</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      onExportCSV();
                      setShowExportDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Icon name="download" size="sm" className="text-gray-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      onPrint();
                      setShowExportDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Icon name="file" size="sm" className="text-gray-400" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Exam Set</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Score</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">%</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 11 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                  <Icon name="folder" size="lg" className="mx-auto mb-2 text-gray-300" />
                  <p>No data found</p>
                </td>
              </tr>
            ) : (
              submissions.map((sub, index) => (
                <tr 
                  key={sub.id} 
                  className={`hover:bg-gray-50 ${selectedIds.has(sub.id) ? 'bg-indigo-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(sub.id)}
                      onChange={() => toggleSelection(sub.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{sub.studentNumber || "-"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.studentName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{sub.classroom || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{sub.studentId}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{sub.examTitle}</td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                    {sub.score}/{sub.totalPoints}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        sub.percentage >= 80
                          ? "bg-green-100 text-green-700"
                          : sub.percentage >= 60
                          ? "bg-blue-100 text-blue-700"
                          : sub.percentage >= 40
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {sub.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(sub.submittedAt)}</td>
                  <td className="px-4 py-3 text-center print:hidden">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/admin/grade/${sub.id}`}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Icon name="edit" size="sm" />
                      </Link>
                      <button
                        onClick={() => onDelete(sub.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="ลบ"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between print:hidden">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
