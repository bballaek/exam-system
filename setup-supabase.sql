-- Run this SQL in your Supabase SQL Editor to create the necessary table for Real-time Monitoring

CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_set_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  classroom TEXT,
  current_question INTEGER NOT NULL DEFAULT 1,
  total_questions INTEGER NOT NULL,
  time_remaining INTEGER,
  warnings INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  last_warning TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Real-time for this table
ALTER TABLE exam_sessions REPLICA IDENTITY FULL;
COMMENT ON TABLE exam_sessions IS 'Table for real-time exam monitoring';

-- Enable RLS (Optional, but recommended)
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for now (You can restrict this later)
CREATE POLICY "Allow all actions for exam_sessions" ON exam_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
