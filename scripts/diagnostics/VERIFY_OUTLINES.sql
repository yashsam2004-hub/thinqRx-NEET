-- =====================================================
-- VERIFY SYLLABUS_OUTLINES TABLE
-- =====================================================

-- Check if table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'syllabus_outlines';

-- Count total outlines
SELECT 
  COUNT(*) as total_outlines,
  COUNT(*) FILTER (WHERE is_default = TRUE) as default_outlines,
  COUNT(*) FILTER (WHERE topic_name IS NULL) as subject_level_outlines,
  COUNT(*) FILTER (WHERE topic_name IS NOT NULL) as topic_level_outlines
FROM public.syllabus_outlines;

-- View all default outlines
SELECT 
  subject_name,
  topic_name,
  is_default,
  jsonb_array_length(outline) as sections_count,
  outline,
  created_at
FROM public.syllabus_outlines
ORDER BY 
  CASE 
    WHEN subject_name = '_default' THEN 0
    ELSE 1
  END,
  subject_name;

-- Test outline retrieval for a specific subject
-- (This simulates what the API does)
SELECT 
  subject_name,
  topic_name,
  outline
FROM public.syllabus_outlines
WHERE subject_name = 'Pharmacognosy'
  AND is_default = TRUE;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'syllabus_outlines';
