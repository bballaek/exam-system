"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { subscribeToExamSessions, ExamSession } from "@/lib/exam-session";

export default function ExamMonitorPage() {
  const params = useParams();
  const examId = params.id as string;
  
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [examTitle, setExamTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch exam title
  useEffect(() => {
    async function fetchExam() {
      try {
        const response = await fetch(`/api/exam-sets/${examId}`);
        if (response.ok) {
          const data = await response.json();
          setExamTitle(data.title || "ข้อสอบ");
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (examId) fetchExam();
  }, [examId]);

  // Subscribe to real-time sessions
  useEffect(() => {
    if (!examId) return;
    
    const unsubscribe = subscribeToExamSessions(examId, (updatedSessions) => {
      setSessions(updatedSessions);
    });

    return () => unsubscribe();
  }, [examId]);

  const formatTime = (seconds?: number) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (session: ExamSession) => {
    if (session.warnings >= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          ถูกเตือน!
        </span>
      );
    }
    if (session.warnings > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          เตือน {session.warnings}x
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        กำลังทำ
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner" size="lg" className="text-gray-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/exams"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <Icon name="arrow-left" size="sm" />
          กลับไปหน้าจัดการข้อสอบ
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Icon name="eye" size="md" className="text-indigo-600" />
              </span>
              ตรวจสอบการสอบ Real-time
            </h1>
            <p className="text-gray-500 mt-1">{examTitle}</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-bold">{sessions.length}</span>
            <span className="text-sm">คนกำลังสอบ</span>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Icon name="users" size="xl" className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">ยังไม่มีนักเรียนกำลังสอบ</p>
          <p className="text-gray-400 text-sm mt-1">หน้านี้จะอัพเดทอัตโนมัติเมื่อมีนักเรียนเริ่มสอบ</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">ชื่อ</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">รหัส</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">ห้อง</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase">ข้อที่</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase">เวลาเหลือ</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase">สถานะ</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">เตือนล่าสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <tr key={session.id} className={`hover:bg-gray-50 ${session.warnings >= 3 ? "bg-red-50" : ""}`}>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{session.student_name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{session.student_id}</td>
                  <td className="px-6 py-4 text-gray-600">{session.classroom || "-"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-900">{session.current_question}</span>
                    <span className="text-gray-400">/{session.total_questions}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-mono font-bold ${
                      session.time_remaining && session.time_remaining < 300 ? "text-red-500" : "text-gray-900"
                    }`}>
                      {formatTime(session.time_remaining)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(session)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {session.last_warning || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          กำลังทำปกติ
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          มีการเตือน
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          เตือนเกิน 3 ครั้ง
        </div>
      </div>
    </div>
  );
}
