"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examTitle: string;
  currentSettings?: {
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
  };
  onSaveSettings?: (settings: {
    scheduledStart: string | null;
    scheduledEnd: string | null;
  }) => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  examId,
  examTitle,
  currentSettings,
  onSaveSettings,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [useSchedule, setUseSchedule] = useState(false);
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const examUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/exam/${examId}` 
    : `/exam/${examId}`;

  // Initialize from current settings
  useEffect(() => {
    if (currentSettings) {
      if (currentSettings.scheduledStart || currentSettings.scheduledEnd) {
        setUseSchedule(true);
        if (currentSettings.scheduledStart) {
          setScheduledStart(currentSettings.scheduledStart.slice(0, 16));
        }
        if (currentSettings.scheduledEnd) {
          setScheduledEnd(currentSettings.scheduledEnd.slice(0, 16));
        }
      } else {
        setUseSchedule(false);
      }
    }
  }, [currentSettings]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(examUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = examUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!onSaveSettings) return;
    setIsSaving(true);
    
    const settings = useSchedule
      ? {
          scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        }
      : {
          scheduledStart: null,
          scheduledEnd: null,
        };

    await onSaveSettings(settings);
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon name="share" size="md" />
              </div>
              <div>
                <h2 className="font-bold text-lg">แชร์ข้อสอบ</h2>
                <p className="text-sm text-white/80 truncate max-w-[200px]">{examTitle}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ลิงก์เข้าสอบ
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={examUrl}
                readOnly
                className="flex-1 px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  copied 
                    ? "bg-green-500 text-white" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                <Icon name={copied ? "check-circle" : "copy"} size="sm" />
                {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
              </button>
            </div>
          </div>

          {/* Schedule Toggle */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Icon name="clock" size="sm" />
              กำหนดเวลาเปิด/ปิดลิงก์
            </label>
            
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setUseSchedule(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !useSchedule
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                เปิดตลอด
              </button>
              <button
                onClick={() => setUseSchedule(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  useSchedule
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                กำหนดเวลา
              </button>
            </div>

            {useSchedule && (
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">เวลาเปิดลิงก์</label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">เวลาปิดลิงก์</label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-400">นักเรียนจะเข้าได้เฉพาะช่วงเวลาที่กำหนดเท่านั้น</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
          >
            ปิด
          </button>
          {onSaveSettings && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Icon name="spinner" size="sm" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Icon name="check-circle" size="sm" />
                  บันทึก
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
