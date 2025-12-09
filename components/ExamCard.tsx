"use client";

import Icon from "@/components/Icon";

interface ExamCardProps {
  id: string;
  title: string;
  teacher: string;
  subject: string;
  subjectColor: string;
  time: number;
  questionCount: number;
  isActive: boolean;
  onStart: (id: string) => void;
}

export default function ExamCard({
  id,
  title,
  teacher,
  subject,
  subjectColor,
  time,
  questionCount,
  isActive,
  onStart,
}: ExamCardProps) {
  const statusConfig = isActive
    ? {
        label: "เปิดสอบ",
        bgColor: "bg-[var(--color-primary)]",
        textColor: "text-white",
        borderColor: "border-[var(--color-primary)]",
      }
    : {
        label: "ปิดสอบ",
        bgColor: "bg-[var(--color-bg)]",
        textColor: "text-[var(--color-text-muted)]",
        borderColor: "border-[var(--color-border)]",
      };

  // Subject color mapping
  const subjectColors: Record<string, string> = {
    math: "bg-purple-100 text-purple-700",
    science: "bg-green-100 text-green-700",
    english: "bg-blue-100 text-blue-700",
    art: "bg-pink-100 text-pink-700",
    thai: "bg-orange-100 text-orange-700",
    default: "bg-gray-100 text-gray-700",
  };

  const subjectStyle = subjectColors[subjectColor] || subjectColors.default;

  return (
    <div
      className={`
        card relative overflow-hidden
        ${isActive ? "border-l-4 border-l-[var(--color-primary)]" : "opacity-75"}
      `}
    >
      {/* Header with Status & Subject */}
      <div className="flex items-center justify-between gap-2 p-4 pb-0">
        <span
          className={`
            inline-flex items-center px-3 py-1 rounded-full text-xs font-bold
            ${statusConfig.bgColor} ${statusConfig.textColor}
          `}
        >
          {statusConfig.label}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${subjectStyle}`}>
          <Icon name="bookmark" size="xs" />
          {subject}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-bold text-[var(--color-text)] mb-1 line-clamp-2">
          {title}
        </h3>
        <p className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] mb-4">
          <Icon name="user" size="xs" />
          {teacher}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-4">
          <div>
            <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">เวลาสอบ</p>
            <p className="flex items-center gap-1 text-sm font-semibold text-[var(--color-text)]">
              <Icon name="clock" size="xs" className="text-[var(--color-primary)]" />
              {time ? `${time} นาที` : "ไม่จำกัด"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">จำนวนข้อ</p>
            <p className="flex items-center gap-1 text-sm font-semibold text-[var(--color-text)]">
              <Icon name="document" size="xs" className="text-[var(--color-primary)]" />
              {questionCount} ข้อ
            </p>
          </div>
        </div>

        {/* Action Button */}
        {isActive ? (
          <button
            onClick={() => onStart(id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Icon name="play" size="sm" />
            เริ่มทำข้อสอบ
            <Icon name="arrow-right" size="xs" />
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-400 rounded-lg text-sm">
            <Icon name="lock" size="sm" />
            ปิดรับสมัคร
          </div>
        )}
      </div>
    </div>
  );
}
