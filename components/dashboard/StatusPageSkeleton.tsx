"use client";

import { StatCardSkeleton } from "./LoadingSkeleton";

export function StatusPageSkeleton() {
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exam List */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-4">
              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="flex items-center gap-4">
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
