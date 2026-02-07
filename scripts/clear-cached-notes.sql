-- Clear All Cached AI Notes
-- Run this in Supabase SQL Editor to force fresh content generation

-- This will delete all cached notes, forcing the system to regenerate them
-- Useful when:
-- 1. You've updated syllabus outlines
-- 2. You've changed AI prompts
-- 3. Old notes have sparse/incomplete content

-- Option 1: Delete ALL cached notes (most aggressive)
DELETE FROM ai_notes;

-- Option 2: Delete notes older than X days (e.g., 7 days)
-- DELETE FROM ai_notes WHERE created_at < NOW() - INTERVAL '7 days';

-- Option 3: Delete notes for specific subject
-- DELETE FROM ai_notes 
-- WHERE topic_id IN (
--   SELECT id FROM syllabus_topics 
--   WHERE subject_id IN (
--     SELECT id FROM syllabus_subjects WHERE name = 'Physical Chemistry'
--   )
-- );

-- Option 4: Delete notes for specific topic
-- DELETE FROM ai_notes 
-- WHERE topic_id = (
--   SELECT id FROM syllabus_topics WHERE name = 'Electrochemistry'
-- );

-- Verify deletion
SELECT COUNT(*) as remaining_cached_notes FROM ai_notes;

-- Expected result: 0 (if using Option 1)

