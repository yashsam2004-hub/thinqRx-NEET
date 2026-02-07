-- =====================================================
-- RECREATE SYLLABUS_OUTLINES TABLE
-- =====================================================
-- This table stores custom study outlines for topics
-- Used by AI notes generation for better content structure
-- =====================================================

-- Create syllabus_outlines table
CREATE TABLE IF NOT EXISTS public.syllabus_outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL,
  topic_name TEXT,
  outline JSONB NOT NULL, -- Array of section names
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_outline_array CHECK (jsonb_typeof(outline) = 'array')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS syllabus_outlines_subject_topic_idx 
  ON public.syllabus_outlines(subject_name, topic_name);

CREATE INDEX IF NOT EXISTS syllabus_outlines_is_default_idx 
  ON public.syllabus_outlines(is_default) WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE public.syllabus_outlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "syllabus_outlines_select_all" ON public.syllabus_outlines;
CREATE POLICY "syllabus_outlines_select_all"
  ON public.syllabus_outlines FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "syllabus_outlines_admin_all" ON public.syllabus_outlines;
CREATE POLICY "syllabus_outlines_admin_all"
  ON public.syllabus_outlines FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Insert default global outline
INSERT INTO public.syllabus_outlines (subject_name, topic_name, outline, is_default)
VALUES (
  '_default',
  NULL,
  '["Introduction and Overview", "Key Concepts and Definitions", "Mechanisms and Processes", "Classification and Types", "Clinical Applications", "Important Examples", "Common Interactions and Side Effects", "Exam-Focused Points"]'::jsonb,
  TRUE
)
ON CONFLICT DO NOTHING;

-- Insert subject-specific default outlines
INSERT INTO public.syllabus_outlines (subject_name, topic_name, outline, is_default)
VALUES 
  -- Pharmaceutical Chemistry
  (
    'Pharmaceutical Chemistry',
    NULL,
    '["Chemical Structure and Properties", "Synthesis and Preparation", "Structure-Activity Relationship (SAR)", "Physicochemical Properties", "Analytical Methods", "Quality Control", "Stability and Storage", "Clinical Significance"]'::jsonb,
    TRUE
  ),
  -- Pharmaceutics
  (
    'Pharmaceutics',
    NULL,
    '["Introduction and Definition", "Formulation Components", "Manufacturing Process", "Quality Attributes", "Stability Considerations", "Packaging and Storage", "Clinical Applications", "Recent Advances"]'::jsonb,
    TRUE
  ),
  -- Pharmacology
  (
    'Pharmacology',
    NULL,
    '["Drug Classification", "Mechanism of Action", "Pharmacokinetics (ADME)", "Pharmacodynamics", "Therapeutic Uses", "Adverse Effects and Toxicity", "Drug Interactions", "Contraindications and Precautions"]'::jsonb,
    TRUE
  ),
  -- Pharmacognosy
  (
    'Pharmacognosy',
    NULL,
    '["Source and Distribution", "Botanical Description", "Chemical Constituents", "Pharmacological Activities", "Traditional Uses", "Commercial Importance", "Adulteration and Substitutes", "Quality Standards"]'::jsonb,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.syllabus_outlines TO authenticated;
GRANT ALL ON public.syllabus_outlines TO service_role;

-- Add comment
COMMENT ON TABLE public.syllabus_outlines IS 'Custom study outlines for AI notes generation. Supports subject-level and topic-level outlines with fallback to defaults.';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ syllabus_outlines table created successfully';
  RAISE NOTICE 'Total outlines: %', (SELECT COUNT(*) FROM public.syllabus_outlines);
  RAISE NOTICE 'Default outlines: %', (SELECT COUNT(*) FROM public.syllabus_outlines WHERE is_default = TRUE);
END $$;
