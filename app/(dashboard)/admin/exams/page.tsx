import { Suspense } from "react";
import { getExamSets } from "@/lib/data/exam-sets";
import ExamManagementPageClient from "@/components/admin/ExamManagementPageClient";
import Icon from "@/components/Icon";

async function ExamSetsContent() {
  const examSets = await getExamSets();
  return <ExamManagementPageClient initialExamSets={examSets} />;
}

export default function ExamManagementPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-3 py-12">
          <Icon name="spinner" size="lg" className="text-indigo-600" />
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    }>
      <ExamSetsContent />
    </Suspense>
  );
}
