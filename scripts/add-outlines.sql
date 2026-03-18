-- Add Default Outlines for SynoRx v2
-- Run this in Supabase SQL Editor after running quick-setup.sql

-- Check if syllabus_outlines table exists, if not create it
CREATE TABLE IF NOT EXISTS public.syllabus_outlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name text NOT NULL,
  topic_name text NOT NULL,
  outline jsonb NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  UNIQUE(subject_name, topic_name)
);

-- Enable RLS if not already enabled
ALTER TABLE public.syllabus_outlines ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'syllabus_outlines' AND policyname = 'syllabus_outlines_select_all'
  ) THEN
    CREATE POLICY "syllabus_outlines_select_all"
    ON public.syllabus_outlines FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'syllabus_outlines' AND policyname = 'syllabus_outlines_write_admin'
  ) THEN
    CREATE POLICY "syllabus_outlines_write_admin"
    ON public.syllabus_outlines FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Insert default outline for all subjects (fallback)
INSERT INTO syllabus_outlines (subject_name, topic_name, outline, description, is_default)
VALUES (
  '_default',
  '_default',
  '["Introduction", "Key Concepts", "Detailed Explanation", "Clinical Applications", "Important Points for GPAT", "Summary"]'::jsonb,
  'Global default outline used when no specific outline exists',
  true
)
ON CONFLICT (subject_name, topic_name) DO UPDATE
SET outline = EXCLUDED.outline, updated_at = now();

-- Insert subject-level defaults
INSERT INTO syllabus_outlines (subject_name, topic_name, outline, description, is_default)
VALUES
  ('Physical Chemistry', '_default', 
   '["Introduction", "Fundamental Principles", "Mathematical Formulations", "Key Equations", "Applications in Pharmacy", "Numerical Problems", "GPAT Focus Points"]'::jsonb,
   'Default outline for Physical Chemistry topics', true),
  
  ('Physical Pharmacy', '_default',
   '["Introduction", "Theoretical Background", "Pharmaceutical Applications", "Key Formulations", "Quality Control Aspects", "Clinical Significance", "GPAT Important Points"]'::jsonb,
   'Default outline for Physical Pharmacy topics', true),
  
  ('Organic Chemistry', '_default',
   '["Introduction", "Structural Features", "Reaction Mechanisms", "Key Compounds", "Pharmaceutical Importance", "Synthesis Methods", "GPAT Questions Pattern"]'::jsonb,
   'Default outline for Organic Chemistry topics', true),
  
  ('Pharmaceutical Chemistry', '_default',
   '["Introduction", "Chemical Classification", "Structure-Activity Relationship", "Mechanism of Action", "Synthesis Routes", "Quality Standards", "Clinical Applications", "GPAT Focus"]'::jsonb,
   'Default outline for Pharmaceutical Chemistry topics', true),
  
  ('Pharmacology', '_default',
   '["Introduction", "Mechanism of Action", "Pharmacokinetics", "Pharmacodynamics", "Therapeutic Uses", "Adverse Effects", "Drug Interactions", "GPAT Important Drugs"]'::jsonb,
   'Default outline for Pharmacology topics', true),
  
  ('Pharmaceutics', '_default',
   '["Introduction", "Formulation Principles", "Manufacturing Process", "Quality Control", "Packaging & Storage", "Regulatory Aspects", "GPAT Focus Areas"]'::jsonb,
   'Default outline for Pharmaceutics topics', true),
  
  ('Pharmacognosy', '_default',
   '["Introduction", "Botanical Source", "Chemical Constituents", "Pharmacological Activities", "Uses & Applications", "Adulteration & Quality Control", "GPAT Important Points"]'::jsonb,
   'Default outline for Pharmacognosy topics', true),
  
  ('Pharmaceutical Analysis', '_default',
   '["Introduction", "Analytical Principles", "Instrumentation", "Methods & Procedures", "Applications", "Quality Assurance", "GPAT Focus Topics"]'::jsonb,
   'Default outline for Pharmaceutical Analysis topics', true),
  
  ('Herbal Drug Technology', '_default',
   '["Introduction", "Plant Sources", "Active Constituents", "Processing Methods", "Standardization", "Quality Control", "Therapeutic Applications", "GPAT Points"]'::jsonb,
   'Default outline for Herbal Drug Technology topics', true),
  
  ('Biostatistics and Research Methodology', '_default',
   '["Introduction", "Statistical Concepts", "Data Analysis Methods", "Research Design", "Applications in Pharmacy", "Interpretation", "GPAT Important Topics"]'::jsonb,
   'Default outline for Biostatistics topics', true)
ON CONFLICT (subject_name, topic_name) DO UPDATE
SET outline = EXCLUDED.outline, updated_at = now();

-- Verify
SELECT 
  subject_name, 
  topic_name, 
  is_default,
  jsonb_array_length(outline) as sections_count
FROM syllabus_outlines
ORDER BY subject_name, topic_name;
