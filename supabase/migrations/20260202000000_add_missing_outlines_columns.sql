-- =====================================================
-- ADD MISSING COLUMNS TO SYLLABUS_OUTLINES TABLE
-- =====================================================
-- Fix for: "Could not find the 'created_by' column"
-- =====================================================

-- Add created_by column (references auth.users)
ALTER TABLE public.syllabus_outlines
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add description column
ALTER TABLE public.syllabus_outlines
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for created_by for better performance
CREATE INDEX IF NOT EXISTS syllabus_outlines_created_by_idx 
  ON public.syllabus_outlines(created_by);

-- Add comment
COMMENT ON COLUMN public.syllabus_outlines.created_by IS 'User who created this outline';
COMMENT ON COLUMN public.syllabus_outlines.description IS 'Optional description for the outline';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  -- Check if columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syllabus_outlines' 
    AND column_name = 'created_by'
  ) THEN
    RAISE NOTICE '✅ created_by column added successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'syllabus_outlines' 
    AND column_name = 'description'
  ) THEN
    RAISE NOTICE '✅ description column added successfully';
  END IF;
  
  RAISE NOTICE 'Current schema for syllabus_outlines:';
  FOR rec IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'syllabus_outlines'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  - %: % (nullable: %)', rec.column_name, rec.data_type, rec.is_nullable;
  END LOOP;
END $$;
