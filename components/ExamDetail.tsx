"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

interface ExamDetailProps {
  exam: {
    id: string;
    title: string;
    teacher: string;
    durationMinutes: number;
    questionCount: number;
    instructions: string[];
  };
  onBack: () => void;
  onStart: () => void;
}

export default function ExamDetail({ exam, onBack, onStart }: ExamDetailProps) {
  const [isConsented, setIsConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartClick = () => {
    setIsLoading(true);
    // Small delay for UX
    setTimeout(() => {
      onStart();
    }, 1500);
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto w-full px-4">
      {/* Back Navigation */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors font-medium"
      >
        <Icon name="arrow-left" size="sm" />
        Back
      </button>

      <div className="bg-[var(--color-bg-light)] rounded-3xl shadow-lg border border-[var(--color-border)] overflow-hidden">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] p-8 md:p-10 text-white text-center relative overflow-hidden">
          {/* Pattern overlay */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-4xl font-bold mb-3 tracking-tight">
              {exam.title}
            </h1>
            <p className="flex items-center justify-center gap-2 text-white/80 text-lg">
              <Icon name="user" size="sm" />
              {exam.teacher}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 divide-x divide-[var(--color-border-light)] border-b border-[var(--color-border-light)]">
          <div className="p-6 flex flex-col items-center justify-center text-center hover:bg-[var(--color-bg)] transition-colors">
            <div className="w-12 h-12 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-3">
              <Icon name="clock" size="md" className="text-[var(--color-primary)]" />
            </div>
            <span className="text-3xl font-bold text-[var(--color-text)]">{exam.durationMinutes}</span>
            <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide font-medium">Minutes</span>
          </div>
          <div className="p-6 flex flex-col items-center justify-center text-center hover:bg-[var(--color-bg)] transition-colors">
            <div className="w-12 h-12 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-3">
              <Icon name="document" size="md" className="text-[var(--color-primary)]" />
            </div>
            <span className="text-3xl font-bold text-[var(--color-text)]">{exam.questionCount}</span>
            <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide font-medium">Questions</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 md:p-12 space-y-8">
          {/* Instructions */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)] mb-4">
              <Icon name="info" size="sm" className="text-[var(--color-primary)]" />
              Instructions
            </h3>
            <div className="bg-[var(--color-bg)] rounded-2xl p-6 border border-[var(--color-border-light)]">
              <ul className="space-y-3">
                {exam.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3 text-[var(--color-text-muted)]">
                    <Icon name="check-circle" size="sm" className="text-[var(--color-success)] flex-shrink-0 mt-0.5" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warning Alert */}
          <div className="alert alert-warning flex items-start gap-4 p-4 rounded-lg">
            <Icon name="warning" size="md" className="flex-shrink-0" />
            <div>
              <h4 className="font-bold">คำเตือนสำคัญ</h4>
              <p className="text-sm mt-1">
                ระบบมีการบันทึกการสลับหน้าต่าง หากมีการออกจากหน้าจอสอบ หรือเปิดแท็บอื่น
                ระบบอาจทำการส่งคำตอบอัตโนมัติทันที
              </p>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="border-t border-[var(--color-border-light)] pt-6">
            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-[var(--color-bg)] transition-colors">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isConsented}
                  onChange={(e) => setIsConsented(e.target.checked)}
                  className="h-5 w-5 cursor-pointer rounded border-2 border-[var(--color-border-dark)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] transition-all accent-[var(--color-primary)]"
                />
              </div>
              <span className="text-[var(--color-text-muted)] select-none group-hover:text-[var(--color-text)]">
                ข้าพเจ้าได้อ่านคำชี้แจงครบถ้วน และยอมรับเงื่อนไขการสอบ
              </span>
            </label>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartClick}
            disabled={!isConsented || isLoading}
            className={`
              w-full py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-bold 
              shadow-lg transition-all transform active:scale-[0.98]
              ${!isConsented || isLoading
                ? "bg-[var(--color-border)] text-[var(--color-text-subtle)] cursor-not-allowed shadow-none"
                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:shadow-xl"
              }
            `}
          >
            {isLoading ? (
              <>
                <Icon name="spinner" size="md" />
                Preparing exam...
              </>
            ) : (
              <>
                Start Exam
                <Icon name="arrow-right" size="md" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-[var(--color-text-subtle)] text-sm mt-8">
        Reference ID: {exam.id} • Session Secure
      </p>
    </div>
  );
}
