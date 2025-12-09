"use client";

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
}: SubmissionsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="document" size="sm" className="text-indigo-600" />
          รายละเอียดผลสอบ ({submissions.length} รายการ)
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
              placeholder="ค้นหาชื่อ หรือ รหัส..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48"
            />
          </div>

          {/* Export Buttons */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Icon name="download" size="xs" />
            CSV
          </button>
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Icon name="file" size="xs" />
            Print
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลำดับ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">เลขที่</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ห้อง</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รหัสนักเรียน</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ชุดข้อสอบ</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">คะแนน</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">%</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">วันที่</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase print:hidden">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                  <Icon name="folder" size="lg" className="mx-auto mb-2 text-gray-300" />
                  <p>ไม่พบข้อมูล</p>
                </td>
              </tr>
            ) : (
              submissions.map((sub, index) => (
                <tr key={sub.id} className="hover:bg-gray-50">
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
                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                        title="ตรวจ"
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
            หน้า {currentPage} จาก {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
