import { Suspense } from "react";
import { getExamSets } from "@/lib/data/exam-sets";
import { isAdmin } from "@/lib/data/auth";
import ExamCardGrid from "@/components/ExamCardGrid";
import ExamSetsSkeleton from "@/components/dashboard/ExamSetsSkeleton";

export const dynamic = 'force-dynamic';

async function DashboardHeader() {
  const admin = await isAdmin();
  const examSets = await getExamSets();
  const activeCount = examSets.filter((e) => e.isActive).length;

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {admin ? "Admin" : "Student"}
      </h1>
      <p className="text-gray-500 text-sm mt-1">
        You have {activeCount} exams open today
      </p>
    </div>
  );
}

async function ExamSetsContent() {
  const examSets = await getExamSets();
  return <ExamCardGrid examSets={examSets} />;
}

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6">
      <Suspense fallback={
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      }>
        <DashboardHeader />
      </Suspense>

      <Suspense fallback={<ExamSetsSkeleton />}>
        <ExamSetsContent />
      </Suspense>
    </div>
  );
}
