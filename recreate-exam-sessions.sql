-- Drop existing table to ensure clean state
DROP TABLE IF EXISTS public.exam_sessions;

-- Create table with all required columns
CREATE TABLE public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_set_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  classroom TEXT,
  current_question INTEGER DEFAULT 1,
  total_questions INTEGER NOT NULL,
  time_remaining INTEGER,
  warnings INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  last_warning TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Real-time for this table
ALTER TABLE public.exam_sessions REPLICA IDENTITY FULL;

-- Enable RLS
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all operations" ON public.exam_sessions FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_exam_sessions_status ON public.exam_sessions(status);
CREATE INDEX idx_exam_sessions_exam_set ON public.exam_sessions(exam_set_id);

COMMENT ON TABLE public.exam_sessions IS 'Table for real-time exam monitoring';
