-- Quick Setup Script for ThinqRx v2
-- Run this in Supabase SQL Editor to setup admin and syllabus

-- Step 1: Set multiple users as admin
UPDATE profiles 
SET role = 'admin' 
WHERE email IN ('pindiprolusskiran@gmail.com', 'myhub1993@gmail.com');

-- If profile doesn't exist yet, create it manually:
-- INSERT INTO profiles (id, email, role) 
-- VALUES ('YOUR_USER_UUID', 'YOUR_EMAIL@example.com', 'admin');

-- Step 2: Clear existing data (optional, run only if you want fresh start)
DELETE FROM syllabus_topics;
DELETE FROM syllabus_subjects;

-- Step 3: Insert subjects
INSERT INTO syllabus_subjects (name, "order") VALUES
('Physical Chemistry', 0),
('Physical Pharmacy', 1),
('Organic Chemistry', 2),
('Pharmaceutical Chemistry', 3),
('Pharmaceutics', 4),
('Pharmacology', 5),
('Pharmacognosy', 6),
('Pharmaceutical Analysis', 7),
('Herbal Drug Technology', 8),
('Biostatistics and Research Methodology', 9)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Insert topics for Physical Chemistry
WITH subject AS (SELECT id FROM syllabus_subjects WHERE name = 'Physical Chemistry')
INSERT INTO syllabus_topics (subject_id, name, slug, "order", is_free_preview) 
SELECT 
  subject.id,
  topic.name,
  topic.slug,
  topic.ord,
  topic.ord < 2 AS is_free_preview
FROM subject, (VALUES
  ('Composition & physical states of matter', 'composition-physical-states-of-matter', 0),
  ('Colligative properties', 'colligative-properties', 1),
  ('Thermodynamics', 'thermodynamics', 2),
  ('Chemical equilibria', 'chemical-equilibria', 3),
  ('Phase rule', 'phase-rule', 4),
  ('Refractive index', 'refractive-index', 5),
  ('Solutions', 'solutions', 6),
  ('Electrochemistry', 'electrochemistry', 7),
  ('Ionic equilibrium', 'ionic-equilibrium', 8),
  ('Kinetics', 'kinetics', 9)
) AS topic(name, slug, ord)
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Step 5: Insert topics for Physical Pharmacy
WITH subject AS (SELECT id FROM syllabus_subjects WHERE name = 'Physical Pharmacy')
INSERT INTO syllabus_topics (subject_id, name, slug, "order", is_free_preview) 
SELECT 
  subject.id,
  topic.name,
  topic.slug,
  topic.ord,
  topic.ord < 2 AS is_free_preview
FROM subject, (VALUES
  ('Matter, properties of matter', 'matter-properties-of-matter', 0),
  ('Micromeritics and powder rheology', 'micromeritics-and-powder-rheology', 1),
  ('Surface and interfacial phenomenon', 'surface-and-interfacial-phenomenon', 2),
  ('Viscosity and rheology', 'viscosity-and-rheology', 3),
  ('Dispersion systems', 'dispersion-systems', 4),
  ('Complexation', 'complexation', 5),
  ('Buffer', 'buffer', 6),
  ('Solubility', 'solubility', 7),
  ('Concepts of dissolution and diffusion', 'concepts-of-dissolution-and-diffusion', 8)
) AS topic(name, slug, ord)
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Step 6: Insert topics for Organic Chemistry
WITH subject AS (SELECT id FROM syllabus_subjects WHERE name = 'Organic Chemistry')
INSERT INTO syllabus_topics (subject_id, name, slug, "order", is_free_preview) 
SELECT 
  subject.id,
  topic.name,
  topic.slug,
  topic.ord,
  topic.ord < 2 AS is_free_preview
FROM subject, (VALUES
  ('General principles', 'general-principles', 0),
  ('Different classes of compounds', 'different-classes-of-compounds', 1),
  ('Protection & deprotection of groups', 'protection-deprotection-of-groups', 2),
  ('Aromaticity & aromatic chemistry', 'aromaticity-aromatic-chemistry', 3),
  ('Different aromatic classes of compounds', 'different-aromatic-classes-of-compounds', 4),
  ('Polycyclic aromatic hydrocarbons', 'polycyclic-aromatic-hydrocarbons', 5),
  ('Carbonyl chemistry', 'carbonyl-chemistry', 6)
) AS topic(name, slug, ord)
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Verify the setup
SELECT 'Subjects:' as label, COUNT(*) as count FROM syllabus_subjects
UNION ALL
SELECT 'Topics:', COUNT(*) FROM syllabus_topics
UNION ALL
SELECT 'Admin users:', COUNT(*) FROM profiles WHERE role = 'admin';
