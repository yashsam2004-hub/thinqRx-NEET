-- ====================================================
-- Clear Chemistry Notes Cache Script
-- ====================================================
-- Purpose: Remove cached AI-generated notes for chemistry subjects
--          to allow regeneration with updated prompts and sanitization
--
-- Usage: Run this in Supabase SQL Editor before regenerating chemistry content
-- ====================================================

-- Option 1: Clear ALL cached notes (nuclear option - use with caution)
-- Uncomment the line below if you want to clear everything
-- DELETE FROM ai_notes;

-- Option 2: Clear only chemistry-related subjects (RECOMMENDED)
DELETE FROM ai_notes 
WHERE topic_id IN (
  SELECT id FROM syllabus_topics 
  WHERE subject_id IN (
    SELECT id FROM syllabus_subjects 
    WHERE name IN (
      'Organic Chemistry', 
      'Pharmaceutical Chemistry', 
      'Medicinal Chemistry',
      'Biochemistry'
    )
  )
);

-- Optional: Verify deletion
SELECT 
  ss.name as subject,
  COUNT(an.id) as remaining_cached_notes
FROM syllabus_subjects ss
LEFT JOIN syllabus_topics st ON st.subject_id = ss.id
LEFT JOIN ai_notes an ON an.topic_id = st.id
WHERE ss.name IN (
  'Organic Chemistry', 
  'Pharmaceutical Chemistry', 
  'Medicinal Chemistry',
  'Biochemistry'
)
GROUP BY ss.name
ORDER BY ss.name;

-- Expected result: All chemistry subjects should show 0 remaining_cached_notes

