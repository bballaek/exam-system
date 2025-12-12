"use client";

import Icon from "@/components/Icon";

interface QuestionTypeCounts {
  CHOICE: number;
  SHORT: number;
  CODEMSA: number;
  TRUE_FALSE: number;
}

interface ExamCardProps {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  time: number;
  questionCount: number;
  totalPoints?: number;
  questionTypeCounts?: QuestionTypeCounts;
  isActive: boolean;
  onStart: (id: string) => void;
}

export default function ExamCard({
  id,
  title,
  subject,
  subjectColor,
  time,
  questionCount,
  totalPoints,
  questionTypeCounts,
  isActive,
  onStart,
}: ExamCardProps) {
  // Tonal color system - monochromatic with varying lightness
  const toneColors: Record<string, {
    bg: string;
    border: string;
    accent: string;
    text: string;
    muted: string;
    button: string;
    buttonHover: string;
    iconBg: string;
  }> = {
    math: {
      bg: "bg-violet-50/70",
      border: "border-violet-300",
      accent: "bg-violet-600",
      text: "text-violet-900",
      muted: "text-violet-600/70",
      button: "bg-violet-600 hover:bg-violet-700",
      buttonHover: "group-hover:border-violet-400",
      iconBg: "bg-violet-100",
    },
    science: {
      bg: "bg-emerald-50/70",
      border: "border-emerald-300",
      accent: "bg-emerald-600",
      text: "text-emerald-900",
      muted: "text-emerald-600/70",
      button: "bg-emerald-600 hover:bg-emerald-700",
      buttonHover: "group-hover:border-emerald-400",
      iconBg: "bg-emerald-100",
    },
    english: {
      bg: "bg-sky-50/70",
      border: "border-sky-300",
      accent: "bg-sky-600",
      text: "text-sky-900",
      muted: "text-sky-600/70",
      button: "bg-sky-600 hover:bg-sky-700",
      buttonHover: "group-hover:border-sky-400",
      iconBg: "bg-sky-100",
    },
    art: {
      bg: "bg-rose-50/70",
      border: "border-rose-300",
      accent: "bg-rose-600",
      text: "text-rose-900",
      muted: "text-rose-600/70",
      button: "bg-rose-600 hover:bg-rose-700",
      buttonHover: "group-hover:border-rose-400",
      iconBg: "bg-rose-100",
    },
    thai: {
      bg: "bg-amber-50/70",
      border: "border-amber-300",
      accent: "bg-amber-600",
      text: "text-amber-900",
      muted: "text-amber-600/70",
      button: "bg-amber-600 hover:bg-amber-700",
      buttonHover: "group-hover:border-amber-400",
      iconBg: "bg-amber-100",
    },
    default: {
      bg: "bg-slate-50/70",
      border: "border-slate-300",
      accent: "bg-slate-600",
      text: "text-slate-900",
      muted: "text-slate-600/70",
      button: "bg-slate-600 hover:bg-slate-700",
      buttonHover: "group-hover:border-slate-400",
      iconBg: "bg-slate-100",
    },
  };

  const tone = toneColors[subjectColor] || toneColors.default;

  return (
    <div
      className={`
        group relative overflow-hidden
        ${tone.bg} rounded-2xl
        border-2 ${tone.border} ${tone.buttonHover}
        p-5
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-black/5
        ${!isActive ? "opacity-50 grayscale" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Subject badge */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${tone.accent}`} />
          <span className={`text-sm font-semibold ${tone.text}`}>
            {subject}
          </span>
        </div>

        {/* Status */}
        <div
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full
            ${isActive ? `${tone.iconBg} ${tone.text}` : "bg-white/60 text-slate-400"}
          `}
        >
          <span
            className={`
              w-1.5 h-1.5 rounded-full
              ${isActive ? `${tone.accent} animate-pulse` : "bg-slate-300"}
            `}
          />
          <span className="text-xs font-medium">
            {isActive ? "เปิดสอบ" : "ปิดสอบ"}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className={`text-lg font-bold ${tone.text} leading-snug line-clamp-2 mb-4`}>
        {title}
      </h3>

      {/* Stats */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className={`
            flex-1 flex items-center gap-2
            ${tone.iconBg} rounded-xl px-2.5 py-2
          `}
        >
          <Icon name="clock" className={`w-3.5 h-3.5 ${tone.muted}`} />
          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wide ${tone.muted}`}>
              เวลา
            </span>
            <span className={`text-xs font-semibold ${tone.text}`}>
              {time ? `${time} นาที` : "∞"}
            </span>
          </div>
        </div>

        <div
          className={`
            flex-1 flex items-center gap-2
            ${tone.iconBg} rounded-xl px-2.5 py-2
          `}
        >
          <Icon name="file-text" className={`w-3.5 h-3.5 ${tone.muted}`} />
          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wide ${tone.muted}`}>
              จำนวน
            </span>
            <span className={`text-xs font-semibold ${tone.text}`}>
              {questionCount} ข้อ
            </span>
          </div>
        </div>

        <div
          className={`
            flex-1 flex items-center gap-2
            ${tone.iconBg} rounded-xl px-2.5 py-2
          `}
        >
          <Icon name="star" className={`w-3.5 h-3.5 ${tone.muted}`} />
          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wide ${tone.muted}`}>
              คะแนน
            </span>
            <span className={`text-xs font-semibold ${tone.text}`}>
              {totalPoints || questionCount} คะแนน
            </span>
          </div>
        </div>
      </div>

      {/* Question Types Breakdown */}
      {questionTypeCounts && (questionTypeCounts.CHOICE > 0 || questionTypeCounts.SHORT > 0 || questionTypeCounts.CODEMSA > 0) && (
        <div className={`flex flex-wrap gap-2 mb-5 ${tone.muted}`}>
          {questionTypeCounts.CHOICE > 0 && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.iconBg} ${tone.text}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              ปรนัย {questionTypeCounts.CHOICE}
            </span>
          )}
          {questionTypeCounts.SHORT > 0 && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.iconBg} ${tone.text}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              เติมคำตอบ {questionTypeCounts.SHORT}
            </span>
          )}
          {questionTypeCounts.CODEMSA > 0 && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.iconBg} ${tone.text}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              โค้ด {questionTypeCounts.CODEMSA}
            </span>
          )}
        </div>
      )}

      {/* Action Button */}
      {isActive ? (
        <button
          onClick={() => onStart(id)}
          className={`
            w-full flex items-center justify-center gap-2
            py-3 px-4
            ${tone.button} text-white
            rounded-xl
            font-semibold text-sm
            transition-all duration-200
            active:scale-[0.98]
            shadow-lg shadow-black/10
            group/btn
          `}
        >
          <span>เริ่มทำข้อสอบ</span>
          <Icon
            name="arrow-right"
            className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5"
          />
        </button>
      ) : (
        <div
          className={`
            w-full flex items-center justify-center gap-2
            py-3 px-4
            bg-white/50 border-2 border-dashed ${tone.border}
            ${tone.muted}
            rounded-xl
            font-medium text-sm
            cursor-not-allowed
          `}
        >
          <Icon name="lock" className="w-4 h-4" />
          <span>ปิด</span>
        </div>
      )}
    </div>
  );
}