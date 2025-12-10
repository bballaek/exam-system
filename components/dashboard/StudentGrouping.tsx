"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import type { StudentGroup } from "@/lib/statistics";

interface StudentGroupingProps {
  groups: StudentGroup[];
  isLoading?: boolean;
}

export default function StudentGrouping({ groups, isLoading }: StudentGroupingProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["กลุ่มเก่ง (Top 27%)"]));

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const totalStudents = groups.reduce((sum, g) => sum + g.students.length, 0);

  if (totalStudents === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-gray-400">
        <Icon name="users" size="lg" className="mx-auto mb-2" />
        <p>ยังไม่มีข้อมูลนักเรียน</p>
      </div>
    );
  }

  const groupIcons = {
    "กลุ่มเก่ง (Top 27%)": "star",
    "กลุ่มกลาง (Middle 46%)": "users",
    "กลุ่มอ่อน (Bottom 27%)": "info",
  } as const;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="users" size="sm" className="text-gray-500" />
          การจัดกลุ่มนักเรียน
          <span className="text-xs font-normal text-gray-400 ml-1">
            (Percentile-based: Top 27% / Middle 46% / Bottom 27%)
          </span>
        </h3>
      </div>

      {/* Groups */}
      <div className="divide-y divide-border">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.name);
          const iconName = groupIcons[group.name as keyof typeof groupIcons] || "users";
          
          return (
            <div key={group.name}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors ${group.bgColor}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    group.color === "green" ? "bg-green-500" : 
                    group.color === "yellow" ? "bg-yellow-500" : "bg-red-500"
                  }`}>
                    <Icon name={iconName as "star" | "users" | "info"} size="sm" className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${group.textColor}`}>
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {group.students.length} คน ({totalStudents > 0 ? Math.round((group.students.length / totalStudents) * 100) : 0}%)
                    </p>
                  </div>
                </div>
                <Icon 
                  name="chevron-down" 
                  size="sm" 
                  className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                />
              </button>

              {/* Student List */}
              {isExpanded && group.students.length > 0 && (
                <div className="bg-white">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">ลำดับ</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-นามสกุล</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">คะแนน</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.students.map((student, idx) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-600">{student.score}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              student.percentage >= 80 ? "bg-green-100 text-green-700" :
                              student.percentage >= 60 ? "bg-blue-100 text-blue-700" :
                              student.percentage >= 40 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {student.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isExpanded && group.students.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  ไม่มีนักเรียนในกลุ่มนี้
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
