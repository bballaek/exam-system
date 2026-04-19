"use client";

export function PrePostPageSkeleton() {
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Pair Selector */}
      <div className="mb-6">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-11 w-full max-w-md bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
            <div className="h-9 w-12 mx-auto bg-gray-200 rounded animate-pulse mb-1" />
            <div className="h-4 w-16 mx-auto bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-44 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
