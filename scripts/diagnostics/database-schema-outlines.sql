-- ====================================================
-- Syllabus Outlines Database Schema
-- ====================================================
-- Purpose: Allow admin to dynamically manage syllabus outlines
--          instead of hardcoding them in TypeScript files
--
-- Usage: Run this in Supabase SQL Editor
-- ====================================================

-- Create table for dynamic syllabus outlines
CREATE TABLE IF NOT EXISTS syllabus_outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  outline JSONB NOT NULL, -- Array of section headings like ["Introduction", "Key Concepts", ...]
  description TEXT, -- Optional description of what this outline covers
  is_default BOOLEAN DEFAULT false, -- If true, this is the default outline for the subject
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(subject_name, topic_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_syllabus_outlines_subject_topic 
  ON syllabus_outlines(subject_name, topic_name);

CREATE INDEX IF NOT EXISTS idx_syllabus_outlines_subject 
  ON syllabus_outlines(subject_name);

CREATE INDEX IF NOT EXISTS idx_syllabus_outlines_default 
  ON syllabus_outlines(subject_name, is_default) 
  WHERE is_default = true;

-- Enable Row Level Security
ALTER TABLE syllabus_outlines ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy 1: Everyone can read outlines (needed for generating notes)
CREATE POLICY "Everyone can read outlines" ON syllabus_outlines
  FOR SELECT
  USING (true);

-- Policy 2: Only admins can insert/update/delete outlines
CREATE POLICY "Admins can manage outlines" ON syllabus_outlines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_syllabus_outlines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_syllabus_outlines_updated_at
  BEFORE UPDATE ON syllabus_outlines
  FOR EACH ROW
  EXECUTE FUNCTION update_syllabus_outlines_updated_at();

-- ====================================================
-- Seed Default Outlines
-- ====================================================

-- Pharmacology - Endocrine System (from your screenshot)
INSERT INTO syllabus_outlines (subject_name, topic_name, outline, description)
VALUES (
  'Pharmacology',
  'Endocrine System',
  '["Introduction", "Hormone Replacement Therapy", "Hormone Synthesis Inhibitors", "Receptor Modulators", "Enzyme Modulators in Diabetes", "Pharmacokinetic Considerations", "Thyroid Drugs", "Adrenal Drugs", "Antidiabetic Drugs", "Sex Hormones & Modulators", "Bone-related Endocrine Drugs", "Comparison Table", "Exam-Oriented Points", "Summary"]'::jsonb,
  'Comprehensive guide to endocrine pharmacology covering all major drug classes'
)
ON CONFLICT (subject_name, topic_name) DO UPDATE
  SET outline = EXCLUDED.outline,
      description = EXCLUDED.description,
      updated_at = NOW();

-- Pharmacology - Cardiovascular System
INSERT INTO syllabus_outlines (subject_name, topic_name, outline)
VALUES (
  'Pharmacology',
  'Cardiovascular System',
  '["Introduction", "Physiology of the System", "Classification of Drugs", "Mechanism of Action", "Therapeutic Uses", "Adverse Effects", "Contraindications", "Comparison Table", "Exam-Oriented Points", "Summary"]'::jsonb
)
ON CONFLICT (subject_name, topic_name) DO NOTHING;

-- Pharmacology - Antihypertensive Drugs
INSERT INTO syllabus_outlines (subject_name, topic_name, outline)
VALUES (
  'Pharmacology',
  'Antihypertensive Drugs',
  '["Introduction", "Classification", "Mechanism of Action", "Pharmacological Effects", "Therapeutic Uses", "Adverse Effects", "Drug Interactions", "Comparison Table", "Exam-Oriented Points", "Summary"]'::jsonb
)
ON CONFLICT (subject_name, topic_name) DO NOTHING;

-- Pharmaceutical Chemistry - Aromatic Compounds
INSERT INTO syllabus_outlines (subject_name, topic_name, outline)
VALUES (
  'Pharmaceutical Chemistry',
  'Aromatic Compounds',
  '["Introduction", "Chemical Structure", "Properties", "Reactions and Mechanisms", "Important Synthesis/Synthetic Routes", "Pharmaceutical Applications", "Structure-Activity Relationship", "Comparison Table", "Exam-Oriented Points", "Summary"]'::jsonb
)
ON CONFLICT (subject_name, topic_name) DO NOTHING;

-- Pharmaceutical Chemistry - Heterocyclic Compounds
INSERT INTO syllabus_outlines (subject_name, topic_name, outline)
VALUES (
  'Pharmaceutical Chemistry',
  'Heterocyclic Compounds',
  '["Introduction", "Classification", "Chemical Properties", "Reaction Mechanisms", "Important Synthesis/Synthetic Routes", "Pharmaceutical Importance", "Named Reactions", "Comparison Table", "Exam-Oriented Points", "Summary"]'::jsonb
)
ON CONFLICT (subject_name, topic_name) DO NOTHING;

-- Organic Chemistry - Aromatic Hydrocarbons
INSERT INTO syllabus_outlines (subject_name, topic_name, outline)
VALUES (
  'Organic Chemistry',
  'Aromatic Hydrocarbons',
  '["Introduction", "Structure and Bonding", "Aromaticity Rules", "Electrophilic Substitution Reactions", "Important Synthesis/Synthetic Routes", "Reaction Mechanisms", "Applications", "Comparison Table", "Exam-Oriented Points", "Summary"]'::jsonb
)
ON CONFLICT (subject_name, topic_name) DO NOTHING;

-- Organic Chemistry - Heterocyclic Chemistry
INSERT INTO syllabus_outlines (subject_name, topic_name, outline)
VALUES (
  'Organic Chemistry',
  'Heterocyclic Chemistry',
  '["Introduction", "Classification of Heterocycles", "Aromaticity in Heterocycles", "Reactions (EAS/NAS)", "Important Synthesis/Synthetic Routes", "Named Reactions", "Pharmaceutical Importance", "Comparison Table", "Exam-Oriented Points", "Summary"]'::jsonb
)
ON CONFLICT (subject_name, topic_name) DO NOTHING;

-- Default outline for any subject (fallback)
INSERT INTO syllabus_outlines (subject_name, topic_name, outline, is_default)
VALUES (
  '_default',
  '_default',
  '["Introduction", "Key Concepts", "Classification", "Detailed Explanation", "Applications", "Important Points", "Comparison Table", "Exam-Oriented Points", "Summary"]'::jsonb,
  true
)
ON CONFLICT (subject_name, topic_name) DO NOTHING;

-- ====================================================
-- Verification Query
-- ====================================================
-- Run this to see all outlines in the database
SELECT 
  id,
  subject_name,
  topic_name,
  jsonb_array_length(outline) as section_count,
  is_default,
  created_at
FROM syllabus_outlines
ORDER BY subject_name, topic_name;

-- ====================================================
-- Usage Examples
-- ====================================================

-- Example 1: Get outline for specific subject and topic
-- SELECT outline FROM syllabus_outlines 
-- WHERE subject_name = 'Pharmacology' AND topic_name = 'Endocrine System';

-- Example 2: Get default outline for a subject
-- SELECT outline FROM syllabus_outlines 
-- WHERE subject_name = 'Pharmacology' AND is_default = true;

-- Example 3: Get all topics for a subject
-- SELECT topic_name, outline FROM syllabus_outlines 
-- WHERE subject_name = 'Pharmacology' 
-- ORDER BY topic_name;

-- Example 4: Update an outline
-- UPDATE syllabus_outlines 
-- SET outline = '["New Section 1", "New Section 2"]'::jsonb
-- WHERE subject_name = 'Pharmacology' AND topic_name = 'Endocrine System';

