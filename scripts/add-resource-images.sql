-- =====================================================
-- ADD IMAGE SUPPORT TO RESOURCES TABLE
-- =====================================================
-- For displaying book cover images, video thumbnails, etc.
-- =====================================================

-- Add image_url column
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN public.resources.image_url IS 'Optional image URL for book covers, video thumbnails, etc.';

-- Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'resources'
  AND column_name = 'image_url';

SELECT '✅ image_url column added to resources table' as status;
