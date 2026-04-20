"use client";

import { useState, useRef, useEffect } from "react";
import Icon from "@/components/Icon";
import { parseCSV, generateSampleCSV, ParsedQuestion } from "@/lib/csvParser";
import { useToast } from "@/components/Toast";

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examSetId: string;
  onSuccess: () => void;
}

export default function ImportQuestionsModal({
  isOpen,
  onClose,
  examSetId,
  onSuccess,
}: ImportQuestionsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const toast = useToast();

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseCSV(content);
      setParsedQuestions(result.questions);
      setErrors(result.errors);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;

    setIsImporting(true);
    try {
      const response = await fetch("/api/questions/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examSetId,
          questions: parsedQuestions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.showToast("success", data.message || "นำเข้าคำถามสำเร็จ");
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        toast.showToast("error", `เกิดข้อผิดพลาด: ${error.error}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.showToast("error", "เกิดข้อผิดพลาดในการนำเข้า");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSample = () => {
    const content = generateSampleCSV();
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_questions.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setParsedQuestions([]);
      setErrors([]);
      setFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }, 200);
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
                Import Questions
              </h2>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                นำเข้าคำถามจาก CSV
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
          {/* Instructions */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">CSV Format</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-700 mb-2">
                หัวตาราง: <code className="bg-blue-100 px-1.5 py-0.5 rounded text-[11px]">text,type,points,options,correctAnswers,subQuestions</code>
              </p>
              <ul className="text-[11px] text-blue-600 space-y-1">
                <li>• <strong>text:</strong> ข้อความคำถาม (required)</li>
                <li>• <strong>type:</strong> CHOICE, SHORT, หรือ CODEMSA (required)</li>
                <li>• <strong>points:</strong> คะแนน (default: 1)</li>
                <li>• <strong>options:</strong> ตัวเลือก คั่นด้วย | (เช่น A|B|C|D)</li>
                <li>• <strong>correctAnswers:</strong> คำตอบที่ถูก คั่นด้วย |</li>
                <li>• <strong>subQuestions:</strong> คำถามย่อยสำหรับ CODEMSA คั่นด้วย |</li>
              </ul>
              <button
                onClick={handleDownloadSample}
                className="mt-3 text-xs text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
              >
                <Icon name="download" size="xs" />
                ดาวน์โหลดไฟล์ตัวอย่าง
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-5" />

          {/* File Upload */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upload File</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
            >
              <Icon name="upload" size="lg" className="mx-auto mb-2 text-gray-300" />
              {fileName ? (
                <p className="text-sm text-gray-700 font-medium">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-1">ลากไฟล์มาวางที่นี่ หรือ</p>
                  <span className="text-sm text-indigo-600 font-medium">เลือกไฟล์ CSV</span>
                </>
              )}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <>
              <div className="h-px bg-gray-100 mx-5" />
              <div className="px-5 py-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1.5">
                    <Icon name="warning" size="xs" className="text-red-500" />
                    พบข้อผิดพลาด ({errors.length} รายการ)
                  </h3>
                  <ul className="text-[11px] text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {errors.map((err, i) => (
                      <li key={i}>
                        แถว {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Preview */}
          {parsedQuestions.length > 0 && (
            <>
              <div className="h-px bg-gray-100 mx-5" />
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Preview ({parsedQuestions.length} คำถาม)
                </p>
                <div className="space-y-2">
                  {parsedQuestions.slice(0, 10).map((q, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-indigo-600">#{i + 1}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          q.type === 'CHOICE' ? 'bg-blue-100 text-blue-700' :
                          q.type === 'SHORT' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {q.type}
                        </span>
                        <span className="text-[11px] text-gray-400">{q.points} pts</span>
                      </div>
                      <p className="text-sm text-gray-700 truncate">{q.text}</p>
                    </div>
                  ))}
                  {parsedQuestions.length > 10 && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      ...และอีก {parsedQuestions.length - 10} คำถาม
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || parsedQuestions.length === 0}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <Icon name="spinner" size="xs" />
                Importing...
              </>
            ) : (
              <>
                <Icon name="upload" size="xs" />
                Import {parsedQuestions.length > 0 ? `${parsedQuestions.length} ข้อ` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
