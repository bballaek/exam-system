"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";

interface Student {
  studentName: string;
  studentId: string;
  classroom: string | null;
  preScore: number;
  postScore: number | null;
  change: number | null;
  status: 'improved' | 'declined' | 'same' | 'incomplete';
}

interface Analysis {
  totalStudents: number;
  completedBoth: number;
  preAvg: number;
  postAvg: number;
  avgChange: number;
  improvedCount: number;
  declinedCount: number;
  sameCount: number;
  students: Student[];
}

interface Pair {
  pairId: string;
  pretest: { id: string; title: string; submissionCount: number };
  posttest: { id: string; title: string; submissionCount: number };
  analysis: Analysis;
}

export default function PrePostAnalysisPage() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [selectedPairId, setSelectedPairId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "change">("change");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/prepost");
        if (response.ok) {
          const data = await response.json();
          setPairs(data.pairs);
          if (data.pairs.length > 0) {
            setSelectedPairId(data.pairs[0].pairId);
          }
        }
      } catch (error) {
        console.error("Error fetching pre-post data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const selectedPair = useMemo(() => {
    return pairs.find(p => p.pairId === selectedPairId);
  }, [pairs, selectedPairId]);

  const sortedStudents = useMemo(() => {
    if (!selectedPair) return [];
    
    const students = [...selectedPair.analysis.students];
    students.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.studentName.localeCompare(b.studentName, "th");
      } else {
        comparison = (a.change ?? -999) - (b.change ?? -999);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return students;
  }, [selectedPair, sortBy, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icon name="spinner" size="lg" className="text-indigo-600" />
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Pre-Post Analysis</h1>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Icon name="chart" size="xl" className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">ยังไม่มีคู่ข้อสอบ Pre-Post</p>
          <p className="text-gray-400 text-sm">
            ตั้งค่าประเภทข้อสอบเป็น Pre-test หรือ Post-test และกำหนด Pair ID เดียวกันในหน้า Edit Exam
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pre-Post Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">วิเคราะห์เปรียบเทียบคะแนนก่อน-หลังเรียน</p>
      </div>

      {/* Pair Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">เลือกชุดวิเคราะห์</label>
        <select
          value={selectedPairId}
          onChange={(e) => setSelectedPairId(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
        >
          {pairs.map((pair) => (
            <option key={pair.pairId} value={pair.pairId}>
              {pair.pairId}: {pair.pretest.title} ↔ {pair.posttest.title}
            </option>
          ))}
        </select>
      </div>

      {selectedPair && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Icon name="users" size="md" className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{selectedPair.analysis.completedBoth}</p>
                  <p className="text-sm text-gray-500">คนที่ทำครบ</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icon name="chart" size="md" className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{selectedPair.analysis.preAvg}%</p>
                  <p className="text-sm text-gray-500">Pre-test เฉลี่ย</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Icon name="chart" size="md" className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{selectedPair.analysis.postAvg}%</p>
                  <p className="text-sm text-gray-500">Post-test เฉลี่ย</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedPair.analysis.avgChange >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Icon 
                    name={selectedPair.analysis.avgChange >= 0 ? "arrow-up" : "arrow-down"} 
                    size="md" 
                    className={selectedPair.analysis.avgChange >= 0 ? 'text-green-600' : 'text-red-600'} 
                  />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    selectedPair.analysis.avgChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedPair.analysis.avgChange >= 0 ? '+' : ''}{selectedPair.analysis.avgChange}%
                  </p>
                  <p className="text-sm text-gray-500">เปลี่ยนแปลงเฉลี่ย</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{selectedPair.analysis.improvedCount}</p>
              <p className="text-sm text-green-700">ดีขึ้น 📈</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-3xl font-bold text-gray-600">{selectedPair.analysis.sameCount}</p>
              <p className="text-sm text-gray-700">เท่าเดิม ➡️</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{selectedPair.analysis.declinedCount}</p>
              <p className="text-sm text-red-700">ลดลง 📉</p>
            </div>
          </div>

          {/* Students Table */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">รายละเอียดรายบุคคล</h3>
              <div className="flex items-center gap-2">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split("-") as ["name" | "change", "asc" | "desc"];
                    setSortBy(by);
                    setSortOrder(order);
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  <option value="change-desc">เปลี่ยนแปลงมาก → น้อย</option>
                  <option value="change-asc">เปลี่ยนแปลงน้อย → มาก</option>
                  <option value="name-asc">ชื่อ ก → ฮ</option>
                  <option value="name-desc">ชื่อ ฮ → ก</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">นักเรียน</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รหัส</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Pre (%)</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Post (%)</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">เปลี่ยนแปลง</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{student.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{student.studentId}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {student.preScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.postScore !== null ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            {student.postScore}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.change !== null ? (
                          <span className={`font-bold ${
                            student.change > 0 ? 'text-green-600' : student.change < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {student.change > 0 ? '+' : ''}{student.change}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.status === 'improved' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            ดีขึ้น ↑
                          </span>
                        )}
                        {student.status === 'declined' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            ลดลง ↓
                          </span>
                        )}
                        {student.status === 'same' && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            เท่าเดิม
                          </span>
                        )}
                        {student.status === 'incomplete' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            ไม่ครบ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
