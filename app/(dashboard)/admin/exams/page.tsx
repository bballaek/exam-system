import { Suspense } from "react";
import { getExamSets } from "@/lib/data/exam-sets";
import ExamManagementPageClient from "@/components/admin/ExamManagementPageClient";
import LogoLoading from "@/components/LogoLoading";

export const dynamic = 'force-dynamic';

async function ExamSetsContent() {
  const examSets = await getExamSets();
  return <ExamManagementPageClient initialExamSets={examSets} />;
}

export default function ExamManagementPage() {
  return (
    <Suspense fallback={<LogoLoading size="lg" text="กำลังโหลดชุดข้อสอบ..." />}>
      <ExamSetsContent />
    </Suspense>
  );
}
