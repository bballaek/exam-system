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
  subjectColor,
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
        group relative overflow-hidden
        bg-white
        rounded-2xl
        border transition-all duration-300 ease-out
        ${isActive 
          ? "border-indigo-200 shadow-lg hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-1 hover:border-indigo-300" 
          : "border-slate-200 shadow-sm opacity-70"
        }
      `}
    >
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
        isActive ? "bg-indigo-600" : "bg-slate-300"
      }`} />

      <div className="p-5 relative z-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          {/* Subject */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-700 tracking-wide uppercase">
              {subject || "Exam"}
            </span>
          </div>

          {/* Status Badge */}
          <div className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
            transition-all duration-300
            ${isActive 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
              : "bg-slate-100 text-slate-500 border border-slate-200"
            }
          `}>
            <span className={`
              relative w-1.5 h-1.5 rounded-full
              ${isActive 
                ? "bg-emerald-500" 
                : "bg-slate-400"
              }
            `} />
            {isActive ? "Open" : "Closed"}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2 mb-4 min-h-[3rem] group-hover:text-indigo-700 transition-colors duration-300">
          {title}
        </h3>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Time */}
          <div className="relative">
            <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100 hover:border-blue-200 transition-all duration-300 group/stat">
              <div className="flex flex-col items-center text-center">
                <div className="mb-1.5 p-1.5 rounded-lg bg-white shadow-sm group-hover/stat:scale-110 transition-transform duration-300">
                  <Icon name="clock" className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 leading-none mb-0.5">{time || "∞"}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Min</div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="relative">
            <div className="bg-indigo-50 rounded-xl p-2.5 border border-indigo-100 hover:border-indigo-200 transition-all duration-300 group/stat">
              <div className="flex flex-col items-center text-center">
                <div className="mb-1.5 p-1.5 rounded-lg bg-white shadow-sm group-hover/stat:scale-110 transition-transform duration-300">
                  <Icon name="file-text" className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 leading-none mb-0.5">{questionCount}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Q's</div>
              </div>
            </div>
          </div>

          {/* Points */}
          <div className="relative">
            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100 hover:border-amber-200 transition-all duration-300 group/stat">
              <div className="flex flex-col items-center text-center">
                <div className="mb-1.5 p-1.5 rounded-lg bg-white shadow-sm group-hover/stat:scale-110 transition-transform duration-300">
                  <Icon name="star" className="w-4 h-4 text-amber-600 fill-amber-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 leading-none mb-0.5">{totalPoints || questionCount}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Types */}
        {questionTypeCounts && (questionTypeCounts.CHOICE > 0 || questionTypeCounts.SHORT > 0 || questionTypeCounts.CODEMSA > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {questionTypeCounts.CHOICE > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Choice {questionTypeCounts.CHOICE}
              </span>
            )}
            {questionTypeCounts.SHORT > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Fill {questionTypeCounts.SHORT}
              </span>
            )}
            {questionTypeCounts.CODEMSA > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
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
              py-3 px-4
              bg-indigo-600
              hover:bg-indigo-700
              text-white font-bold text-sm
              rounded-xl
              transition-all duration-300
              active:scale-[0.98]
              shadow-lg shadow-indigo-500/30
              hover:shadow-xl hover:shadow-indigo-500/40
              group/btn
            `}
          >
            <span>Start Exam</span>
            <Icon
              name="arrow-right"
              className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
            />
          </button>
        ) : (
          <div
            className={`
              w-full flex items-center justify-center gap-2
              py-3 px-4
              bg-slate-100 text-slate-400
              rounded-xl
              font-bold text-sm
              cursor-not-allowed
              border-2 border-dashed border-slate-200
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
