"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

export interface ExamStatus {
  exam_set_id: string;
  title: string;
  active_count: number;
  warning_count: number;
}

interface ExamStatusResponse {
  examStatuses: ExamStatus[];
  totalActive: number;
  totalWarnings: number;
}

async function fetchExamStatus(): Promise<ExamStatusResponse> {
  const supabase = createClient();

  // Get all active sessions from Supabase
  const { data: sessions, error } = await supabase
    .from("exam_sessions")
    .select("exam_set_id, warnings")
    .eq("status", "active");

  if (error) {
    console.error("Error fetching exam sessions:", error);
    throw error;
  }

  if (!sessions || sessions.length === 0) {
    return { examStatuses: [], totalActive: 0, totalWarnings: 0 };
  }

  // Group by exam_set_id
  const examMap = new Map<string, { count: number; warnings: number }>();
  sessions.forEach((s) => {
    const existing = examMap.get(s.exam_set_id) || { count: 0, warnings: 0 };
    examMap.set(s.exam_set_id, {
      count: existing.count + 1,
      warnings: existing.warnings + (s.warnings > 0 ? 1 : 0),
    });
  });

  // Fetch all titles via API (since ExamSet is in Prisma, not Supabase)
  const examIds = Array.from(examMap.keys());
  let titles: Record<string, string> = {};
  
  try {
    const res = await fetch("/api/exam-sets/bulk-titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: examIds }),
    });
    
    if (res.ok) {
      const data = await res.json();
      titles = data.titles || {};
    }
  } catch (e) {
    console.error("Error fetching exam titles:", e);
  }

  // Build status array
  const examStatuses: ExamStatus[] = Array.from(examMap.entries()).map(
    ([id, data]) => ({
      exam_set_id: id,
      title: titles[id] || "Unknown",
      active_count: data.count,
      warning_count: data.warnings,
    })
  );

  const totalActive = examStatuses.reduce((sum, e) => sum + e.active_count, 0);
  const totalWarnings = examStatuses.reduce((sum, e) => sum + e.warning_count, 0);

  return { examStatuses, totalActive, totalWarnings };
}

export function useExamStatus() {
  const { data, error, isLoading, mutate } = useSWR<ExamStatusResponse>(
    "exam-status",
    fetchExamStatus,
    {
      refreshInterval: 10000, // Auto-refresh every 10 seconds
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    examStatuses: data?.examStatuses || [],
    totalActive: data?.totalActive || 0,
    totalWarnings: data?.totalWarnings || 0,
    isLoading,
    isError: error,
    mutate,
  };
}
