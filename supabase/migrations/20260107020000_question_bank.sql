-- Question Bank for pre-generated GPAT questions
-- This allows admins to pre-generate and curate questions for instant delivery

CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'Assertion-Reason', 'True/False', 'Fill in the blanks', 'Match the following')),
  options TEXT[], -- Array of options for MCQ/multiple choice
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'GPAT' CHECK (difficulty IN ('EASY', 'GPAT', 'HARD')),
  is_verified BOOLEAN NOT NULL DEFAULT false, -- Admin verification flag
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_bank_topic ON public.question_bank(topic_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON public.question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_bank_verified ON public.question_bank(is_verified);
CREATE INDEX IF NOT EXISTS idx_question_bank_type ON public.question_bank(question_type);

-- Updated_at trigger
CREATE TRIGGER trg_question_bank_updated_at
BEFORE UPDATE ON public.question_bank
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS Policies
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Students can read verified questions for topics they can access
CREATE POLICY question_bank_select_verified 
ON public.question_bank FOR SELECT 
TO authenticated
USING (is_verified = true);

-- Admins can do everything
CREATE POLICY question_bank_admin_all 
ON public.question_bank FOR ALL 
TO authenticated
USING (public.is_admin());

-- Add suggested resources to syllabus_topics
ALTER TABLE public.syllabus_topics
ADD COLUMN IF NOT EXISTS suggested_books TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS suggested_videos JSONB DEFAULT '[]';

-- Example structure for suggested_videos:
-- [
--   {"title": "Chemical Equilibrium GPAT", "youtubeId": "abc123"},
--   {"title": "Le Chatelier Principle", "youtubeId": "xyz789"}
-- ]

COMMENT ON TABLE public.question_bank IS 'Pre-generated and curated GPAT questions for instant test generation';
COMMENT ON COLUMN public.syllabus_topics.suggested_books IS 'Array of recommended textbook references';
COMMENT ON COLUMN public.syllabus_topics.suggested_videos IS 'JSONB array of YouTube videos with title and youtubeId';

