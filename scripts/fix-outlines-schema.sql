-- =====================================================
-- QUICK FIX: ADD MISSING COLUMNS TO SYLLABUS_OUTLINES
-- =====================================================
-- Run this directly in Supabase SQL Editor
-- =====================================================

-- Add created_by column
ALTER TABLE public.syllabus_outlines
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add description column
ALTER TABLE public.syllabus_outlines
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index
CREATE INDEX IF NOT EXISTS syllabus_outlines_created_by_idx 
  ON public.syllabus_outlines(created_by);

-- Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'syllabus_outlines'
ORDER BY ordinal_position;
