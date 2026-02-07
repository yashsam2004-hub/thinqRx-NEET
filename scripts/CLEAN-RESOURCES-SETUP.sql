-- =====================================================
-- CLEAN RESOURCES SETUP (HANDLES EXISTING TABLE)
-- =====================================================
-- This script is safe to run multiple times
-- =====================================================

-- 1. Create helper function (safe to recreate)
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

-- 2. Add image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN image_url TEXT;
    RAISE NOTICE '✅ image_url column added';
  ELSE
    RAISE NOTICE 'ℹ️  image_url column already exists';
  END IF;
END $$;

-- 3. Drop and recreate policies (safe)
DROP POLICY IF EXISTS "resources_select_active" ON public.resources;
DROP POLICY IF EXISTS "resources_admin_all" ON public.resources;

-- 4. Create policies
CREATE POLICY "resources_select_active"
  ON public.resources FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "resources_admin_all"
  ON public.resources FOR ALL
  TO authenticated
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- 5. Grant permissions (safe to run multiple times)
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT ALL ON public.resources TO service_role;

-- 6. Verify setup
SELECT 
  '✅ Setup complete!' as status,
  (SELECT COUNT(*) FROM public.resources) as total_resources,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'image_url') as has_image_column,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'resources') as policy_count;

-- 7. Show current resources
SELECT 
  category,
  title,
  CASE WHEN image_url IS NOT NULL THEN '📸 Yes' ELSE '❌ No' END as has_image,
  url
FROM public.resources
ORDER BY category, display_order;
