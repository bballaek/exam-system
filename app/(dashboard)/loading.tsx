import Icon from "@/components/Icon";

export default function Loading() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
        <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
      </div>
      <div className="flex items-center justify-center gap-3 py-20">
        <Icon name="spinner" size="lg" className="text-gray-600" />
        <span className="text-gray-500">Loading...</span>
      </div>
    </div>
  );
}



