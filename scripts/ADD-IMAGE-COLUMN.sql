-- =====================================================
-- ADD IMAGE SUPPORT TO EXISTING RESOURCES TABLE
-- =====================================================
-- Run this if you already created the resources table
-- =====================================================

-- Add image_url column to existing table
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN public.resources.image_url IS 'Optional image URL for book covers, video thumbnails, etc.';

-- Verify
SELECT 
  '✅ image_url column added!' as status,
  COUNT(*) as total_resources
FROM public.resources;

-- Show columns
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;
