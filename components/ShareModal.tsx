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
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [useSchedule, setUseSchedule] = useState(false);
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const examUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/exam/${examId}` 
    : `/exam/${examId}`;

  const embedCode = typeof window !== "undefined"
    ? `<iframe src="${window.location.origin}/embed/exam/${examId}" width="100%" height="450" style="border:none;"></iframe>`
    : `<iframe src="/embed/exam/${examId}" width="100%" height="450" style="border:none;"></iframe>`;

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

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

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

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

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = embedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
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
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full sm:w-[480px] h-full bg-white flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleClose}
              className="p-1.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Icon name="arrow-left" size="sm" className="text-gray-500" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-gray-900 truncate">
                Share Exam
              </h2>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {examTitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden lg:flex"
          >
            <Icon name="close" size="sm" className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Exam Link */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Exam Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={examUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 truncate focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                <Icon name={copied ? "check-circle" : "copy"} size="xs" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-5" />

          {/* Embed Code */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Embed Code</p>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">New</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={embedCode}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 truncate font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyEmbed}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                  copiedEmbed
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon name={copiedEmbed ? "check-circle" : "copy"} size="xs" />
                {copiedEmbed ? "Copied!" : "HTML"}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-5" />

          {/* Schedule */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Schedule</p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUseSchedule(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !useSchedule
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Always Open
              </button>
              <button
                onClick={() => setUseSchedule(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  useSchedule
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Set Schedule
              </button>
            </div>

            {useSchedule && (
              <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100 animate-fade-in">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">เวลาเปิดลิงก์</label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">เวลาปิดลิงก์</label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  นักเรียนจะเข้าทำข้อสอบได้เฉพาะในช่วงเวลาที่กำหนด
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {onSaveSettings && (
          <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <Icon name="spinner" size="xs" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="check-circle" size="xs" />
                  Save
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
