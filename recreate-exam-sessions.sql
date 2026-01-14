-- Run this SQL in Supabase Dashboard > SQL Editor
-- หรือ psql to create the exam_sessions table

CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_set_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  status TEXT DEFAULT 'active',
  warnings INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations" ON public.exam_sessions FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON public.exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_set ON public.exam_sessions(exam_set_id);
