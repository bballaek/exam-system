import Icon from "@/components/Icon";

export default function ExamSetsSkeleton() {
  return (
    <div className="flex items-center justify-center gap-3 py-20">
      <Icon name="spinner" size="lg" className="text-gray-600" />
      <span className="text-gray-500">Loading exams...</span>
    </div>
  );
}



