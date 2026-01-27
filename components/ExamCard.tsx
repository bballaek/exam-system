"use client";

import React from "react";
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

function ExamCard({
  id,
  title,
  subject,
  time,
  questionCount,
  totalPoints,
  questionTypeCounts,
  isActive,
  onStart,
}: ExamCardProps) {
  const handleStart = React.useCallback(() => {
    onStart(id);
  }, [id, onStart]);

  return (
    <div
      className={`
        group relative
        bg-white
        rounded-xl
        border transition-all duration-200 ease-out
        ${isActive 
          ? "border-gray-200 hover:border-gray-300 hover:shadow-lg" 
          : "border-gray-100 opacity-60"
        }
      `}
    >
      <div className="p-5">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-3">
          {/* Subject Badge */}
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            {subject || "Exam"}
          </span>

          {/* Status Badge */}
          <div className={`
            inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium
            ${isActive 
              ? "bg-emerald-50 text-emerald-600" 
              : "bg-gray-100 text-gray-400"
            }
          `}>
            <span className={`
              w-1.5 h-1.5 rounded-full
              ${isActive ? "bg-emerald-500" : "bg-gray-300"}
            `} />
            {isActive ? "Open" : "Closed"}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2 mb-4 min-h-[2.5rem] group-hover:text-gray-700 transition-colors">
          {title}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Icon name="clock" className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">{time || "∞"}</span>
            <span className="text-gray-400">min</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <Icon name="file-text" className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">{questionCount}</span>
            <span className="text-gray-400">questions</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <Icon name="star" className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">{totalPoints || questionCount}</span>
            <span className="text-gray-400">pts</span>
          </div>
        </div>

        {/* Question Types */}
        {questionTypeCounts && (questionTypeCounts.CHOICE > 0 || questionTypeCounts.SHORT > 0 || questionTypeCounts.CODEMSA > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {questionTypeCounts.CHOICE > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                Choice {questionTypeCounts.CHOICE}
              </span>
            )}
            {questionTypeCounts.SHORT > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                Fill {questionTypeCounts.SHORT}
              </span>
            )}
            {questionTypeCounts.CODEMSA > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                Code {questionTypeCounts.CODEMSA}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        {isActive ? (
          <button
            onClick={handleStart}
            className={`
              w-full
              flex items-center justify-center gap-2
              py-2.5 px-4
              bg-gray-900
              hover:bg-gray-800
              text-white font-medium text-sm
              rounded-lg
              transition-all duration-200
              active:scale-[0.98]
              group/btn
            `}
          >
            <span>Start Exam</span>
            <Icon
              name="arrow-right"
              className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5"
            />
          </button>
        ) : (
          <div
            className={`
              w-full flex items-center justify-center gap-2
              py-2.5 px-4
              bg-gray-50 text-gray-400
              rounded-lg
              font-medium text-sm
              cursor-not-allowed
              border border-gray-100
            `}
          >
            <Icon name="lock" className="w-4 h-4" />
            <span>Closed</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ExamCard);
