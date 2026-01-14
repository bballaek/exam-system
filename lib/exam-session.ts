import { createClient } from "@/lib/supabase/client";

export interface ExamSession {
  id?: string;
  exam_set_id: string;
  student_name: string;
  student_id: string;
  classroom?: string;
  current_question: number;
  total_questions: number;
  time_remaining?: number;
  warnings: number;
  status: "active" | "submitted" | "kicked";
  last_warning?: string;
  started_at?: string;
  updated_at?: string;
}

// Create a new exam session when student starts
export async function createExamSession(session: Omit<ExamSession, "id" | "started_at" | "updated_at">): Promise<string | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("exam_sessions")
    .insert([{
      ...session,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select("id")
    .single();

  if (error) {
    console.error("Error creating exam session:", error.message, error.code, error.details);
    return null;
  }

  return data?.id || null;
}

// Update exam session (progress, warnings, etc)
export async function updateExamSession(sessionId: string, updates: Partial<ExamSession>): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("exam_sessions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    console.error("Error updating exam session:", error);
    return false;
  }

  return true;
}

// Mark session as submitted
export async function submitExamSession(sessionId: string): Promise<boolean> {
  return updateExamSession(sessionId, { status: "submitted" });
}

// Delete session (optional cleanup)
export async function deleteExamSession(sessionId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("exam_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("Error deleting exam session:", error);
    return false;
  }

  return true;
}

// Subscribe to exam sessions for a specific exam (for teacher dashboard)
export function subscribeToExamSessions(
  examSetId: string,
  onUpdate: (sessions: ExamSession[]) => void
) {
  const supabase = createClient();

  // Initial fetch
  supabase
    .from("exam_sessions")
    .select("*")
    .eq("exam_set_id", examSetId)
    .eq("status", "active")
    .then(({ data }) => {
      if (data) onUpdate(data as ExamSession[]);
    });

  // Subscribe to changes
  const channel = supabase
    .channel(`exam_sessions_${examSetId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "exam_sessions",
        filter: `exam_set_id=eq.${examSetId}`,
      },
      async () => {
        // Refetch all active sessions on any change
        const { data } = await supabase
          .from("exam_sessions")
          .select("*")
          .eq("exam_set_id", examSetId)
          .eq("status", "active");
        
        if (data) onUpdate(data as ExamSession[]);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
