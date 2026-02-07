-- =====================================================
-- QUICK SETUP: RESOURCES TABLE & DATA
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create the helper function if not exists
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('reference_books', 'video_lectures', 'official_links')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT DEFAULT 'ExternalLink',
  is_external BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS resources_category_idx ON public.resources(category);
CREATE INDEX IF NOT EXISTS resources_active_idx ON public.resources(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS resources_order_idx ON public.resources(display_order);

-- 4. Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies
DROP POLICY IF EXISTS "resources_select_active" ON public.resources;
DROP POLICY IF EXISTS "resources_admin_all" ON public.resources;

-- 6. Create policies
CREATE POLICY "resources_select_active"
  ON public.resources FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "resources_admin_all"
  ON public.resources FOR ALL
  TO authenticated
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- 7. Grant permissions
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT ALL ON public.resources TO service_role;

-- 8. Insert default resources
INSERT INTO public.resources (category, title, description, url, icon_name, display_order) VALUES
-- Reference Books
('reference_books', 'Pharmaceutical Chemistry Reference', 'Recommended textbooks and reference materials for pharmaceutical chemistry', '#', 'Beaker', 1),
('reference_books', 'Pharmacology Standard Books', 'Standard pharmacology books for GPAT preparation', '#', 'Pill', 2),
('reference_books', 'Pharmaceutics Core Books', 'Core pharmaceutics reference books and study materials', '#', 'Microscope', 3),

-- Video Lectures
('video_lectures', 'YouTube Channel', 'Free video lectures on pharmacy topics', '#', 'Youtube', 1),
('video_lectures', 'Concept Videos', 'Short videos explaining difficult pharmacy concepts', '#', 'Video', 2),

-- Official Links
('official_links', 'NTA GPAT Official Website', 'National Testing Agency - GPAT exam portal', 'https://gpat.nta.ac.in/', 'ExternalLink', 1),
('official_links', 'Pharmacy Council of India', 'Official PCI website for regulations and updates', 'https://www.pci.nic.in/', 'ExternalLink', 2),
('official_links', 'GPAT Notifications', 'Latest exam notifications and announcements', '#', 'Newspaper', 3)
ON CONFLICT DO NOTHING;

-- 9. Verify
DO $$
DECLARE
  total_count INTEGER;
  ref_books INTEGER;
  video_lec INTEGER;
  off_links INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.resources;
  SELECT COUNT(*) INTO ref_books FROM public.resources WHERE category = 'reference_books';
  SELECT COUNT(*) INTO video_lec FROM public.resources WHERE category = 'video_lectures';
  SELECT COUNT(*) INTO off_links FROM public.resources WHERE category = 'official_links';
  
  RAISE NOTICE '✅ Setup complete!';
  RAISE NOTICE 'Total resources: %', total_count;
  RAISE NOTICE '  - Reference Books: %', ref_books;
  RAISE NOTICE '  - Video Lectures: %', video_lec;
  RAISE NOTICE '  - Official Links: %', off_links;
END $$;
