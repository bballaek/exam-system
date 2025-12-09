"use client";

import { useState, useRef } from "react";
import Icon from "@/components/Icon";
import { parseCSV, generateSampleCSV, ParsedQuestion } from "@/lib/csvParser";

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
        alert(data.message || "นำเข้าคำถามสำเร็จ");
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        alert(`เกิดข้อผิดพลาด: ${error.error}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("เกิดข้อผิดพลาดในการนำเข้า");
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
    setParsedQuestions([]);
    setErrors([]);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon name="upload" size="sm" className="text-indigo-600" />
            นำเข้าคำถามจาก CSV
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
            <Icon name="close" size="sm" className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">รูปแบบ CSV ที่รองรับ:</h3>
            <p className="text-xs text-blue-700 mb-2">
              หัวตาราง: <code className="bg-blue-100 px-1 rounded">text,type,points,options,correctAnswers,subQuestions</code>
            </p>
            <ul className="text-xs text-blue-600 space-y-1">
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

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Icon name="upload" size="lg" className="mx-auto mb-2 text-gray-400" />
            {fileName ? (
              <p className="text-sm text-gray-700 mb-2">
                <strong>{fileName}</strong>
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-2">ลากไฟล์มาวางที่นี่ หรือ</p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              เลือกไฟล์ CSV
            </button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                <Icon name="warning" size="xs" className="inline mr-1" />
                พบข้อผิดพลาด ({errors.length} รายการ)
              </h3>
              <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i}>
                    แถว {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {parsedQuestions.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                  ตัวอย่างข้อมูล ({parsedQuestions.length} คำถาม)
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ข้อ</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">คำถาม</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ประเภท</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">คะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedQuestions.slice(0, 10).map((q, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 text-gray-900 truncate max-w-[200px]">{q.text}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            q.type === 'CHOICE' ? 'bg-blue-100 text-blue-700' :
                            q.type === 'SHORT' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {q.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{q.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedQuestions.length > 10 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    ...และอีก {parsedQuestions.length - 10} คำถาม
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || parsedQuestions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <Icon name="spinner" size="sm" />
                กำลังนำเข้า...
              </>
            ) : (
              <>
                <Icon name="upload" size="sm" />
                นำเข้า {parsedQuestions.length} คำถาม
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
