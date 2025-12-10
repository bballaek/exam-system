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
      
      {/* Modal - Updated styling */}
      <div className="relative rounded-xl border border-border bg-card w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon name="share" size="md" className="text-gray-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">แชร์ข้อสอบ</h2>
              <p className="text-sm text-gray-500 truncate max-w-[200px]">{examTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="close" size="sm" className="text-gray-500" />
          </button>
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
                className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-gray-600 truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  copied 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-900 text-white hover:bg-gray-800"
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
              <Icon name="clock" size="sm" className="text-gray-400" />
              กำหนดเวลาเปิด/ปิดลิงก์
            </label>
            
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setUseSchedule(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !useSchedule
                    ? "bg-gray-900 text-white"
                    : "bg-muted text-gray-600 hover:bg-gray-200"
                }`}
              >
                เปิดตลอด
              </button>
              <button
                onClick={() => setUseSchedule(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  useSchedule
                    ? "bg-gray-900 text-white"
                    : "bg-muted text-gray-600 hover:bg-gray-200"
                }`}
              >
                กำหนดเวลา
              </button>
            </div>

            {useSchedule && (
              <div className="space-y-3 bg-muted rounded-lg p-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">เวลาเปิดลิงก์</label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">เวลาปิดลิงก์</label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-card rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-400">นักเรียนจะเข้าได้เฉพาะช่วงเวลาที่กำหนดเท่านั้น</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted border-t border-border flex justify-end gap-3">
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
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
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

